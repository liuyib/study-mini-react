/**
 * 实现 useState 函数逻辑
 * 1. 初始一个全局变量，用于保存 useState 的初始值，以便后续使用
 * 2. 在 Fiber 上添加一个 hooks 属性，用于记录一个组件中多个 Hooks 的索引，
 *    以支持在同一个组件中多次调用 Hooks
 * 3. 在函数组件中调用 Hooks 时，做如下处理：
 *    a. 检查是否有一个旧的 Hook 对象 `fiber.alternate.hooks[hookIndex]`，有值则表明有旧 Hook 对象
 *    b. 如果有旧 Hook 对象，将其 state 赋值给新 Hook 对象作初值；否则，用默认值作初值
 *    c. 返回新 Hook
 */

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === 'object' ? child : createTextElement(child);
      }),
    },
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (name) => name.startsWith('on');
const isProperty = (name) => !isEvent(name) && name !== 'children';
const isOld = (oldProps, newProps) => (key) => oldProps[key] && !newProps[key];
// “next 中有新的键”或“prev 和 next 中相同键的值不同”
const isNew = (oldProps, newProps) => (key) => oldProps[key] !== newProps[key];

function updateDom(dom, oldProps, newProps) {
  // 移除旧属性
  Object.keys(oldProps)
    .filter(isProperty)
    .filter(isOld(oldProps, newProps))
    .forEach((name) => {
      dom[name] = '';
    });
  // 添加新属性
  Object.keys(newProps)
    .filter(isProperty)
    .filter(isNew(oldProps, newProps))
    .forEach((name) => {
      dom[name] = newProps[name];
    });

  // 移除旧事件
  Object.keys(oldProps)
    .filter(isEvent)
    .filter(isOld(oldProps, newProps))
    .forEach((name) => {
      // onClick -> click
      const newName = name.substring(2).toLowerCase();

      dom.removeEventListener(newName, oldProps[name]);
    });
  // 添加新事件
  Object.keys(newProps)
    .filter(isEvent)
    .filter(isNew(oldProps, newProps))
    .forEach((name) => {
      const newName = name.substring(2).toLowerCase();

      dom.addEventListener(newName, newProps[name]);
    });
}

function deleteDom(fiber, parentDom) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else {
    deleteDom(fiber.child, parentDom);
  }
}

function commitRoot() {
  // 提交被“删除”的 Fiber
  deletions.forEach(commitWork);
  // 提交被“添加、更新”的 Fiber
  commitWork(wipRoot.child);
  oldRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  let fiberParent = fiber.parent;

  // 需要用到 Fiber 的 parent 时，一直向上找，直到找到具有 DOM 的 Fiber
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    fiberParent.dom.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    deleteDom(fiber, fiberParent.dom);

    // 递归删除 Fiber 对应的所有后代 DOM 后，需要停止 commitWork 函数的递归，
    // 否则删除的 DOM 又会被重新添加到页面上，因为被标记 "DELETION" 的 Fiber，
    // 其后代 Fiber 不一定也被标记了 "DELETION"，因此不能再继续递归
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  unitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: oldRoot,
  };
  wipRoot = unitOfWork;
  deletions = [];
}

let unitOfWork = null;
let wipRoot = null;
let oldRoot = null;
let deletions = null;

function workLoop(idleDeadline) {
  let shouldYield = false;

  while (unitOfWork && !shouldYield) {
    unitOfWork = performUnitOfWork(unitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  // 处理完了所有工作，将 Fiber 统一提交到 DOM
  if (!unitOfWork && wipRoot) {
    commitRoot();
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function';

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 搜索 Fiber 树（顺序依次是：孩子、兄弟、父兄弟），返回第一个找到的 Fiber 节点
  if (fiber.child) {
    return fiber.child;
  }

  while (fiber) {
    if (fiber.sibling) {
      return fiber.sibling;
    }

    fiber = fiber.parent;
  }
}

let hookIndex = null;

function updateFunctionComponent(fiber) {
  hookIndex = 0;
  unitOfWork.hooks = [];

  // 对于函数式组件，其没有对应的 DOM，通过执行其对应的函数即可得到 children
  const element = fiber.type(fiber.props);

  reconcileChildren(fiber, [element]);
}

function useState(initial) {
  const oldHook = unitOfWork.alternate?.hooks?.[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
  };

  unitOfWork.hooks.push(hook);
  hookIndex++;

  return [hook.state];
}

function updateHostComponent(fiber) {
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  // 协调 Fiber 与其子元素
  reconcileChildren(fiber, elements);
}

function reconcileChildren(fiber, elements) {
  let oldFiber = fiber.alternate?.child;
  let prevSibling = null;

  for (let index = 0; index < elements.length || oldFiber; index++) {
    const element = elements[index];
    let newFiber = null;

    // 对比“旧 Fiber”与“新元素”，步骤如下：
    // 1. 如果 type 一致，证明 DOM 节点不需要变，只更新参数
    // 2. 如果“type 不同”并且“新元素存在”，则需要创建新的 DOM 节点
    // 3. 如果“type 不同”、"新元素不存在"并且“存在旧的 Fiber”，则需要删除旧的 DOM 节点
    //
    // 注：React 在这里会用 key 来对比，以判断“节点在元素数组中换了位置”

    const isSameType = oldFiber && element && oldFiber.type === element.type;

    if (isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        // 在后面 commit 阶段将会用到这个属性
        effectTag: 'UPDATE',
      };
    } else if (element) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: fiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    } else if (oldFiber) {
      oldFiber.effectTag = 'DELETION';
      // 对于需要删除的旧 Fiber，我们不再把他连接到新 Fiber 上（新 Fiber 以 wipRoot 为根），
      // 当我们用 wipRoot 把 Fiber 树提交到 DOM 时，其上没有“旧 Fiber”，
      // 因此需要用数组把所有“旧 Fiber”保存下来
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 新创建的 Fiber 能成为“孩子”还是“兄弟”，取决于它是否是第一个后代
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  }
}

const MiniReact = {
  createElement,
  render,
  useState,
};

/** @jsx MiniReact.createElement */

function Test() {
  return <div>test</div>;
}

function Counter() {
  const [count, setCount] = MiniReact.useState(0);
  const [visible, setVisible] = MiniReact.useState(true);

  const onAddClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1 onClick={onAddClick}>Count: {count}</h1>

      <button onClick={() => setVisible(!visible)}>toggle</button>
      {visible ? <Test /> : null}
    </div>
  );
}

const element = <Counter />;
const container = document.getElementById('root');

MiniReact.render(element, container);
