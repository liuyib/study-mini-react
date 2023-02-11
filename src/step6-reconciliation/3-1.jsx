/**
 * 优化 commitWork 函数，让 `effectTag` 标记生效
 *
 * `effectTag` 标记值作用：
 * 1. PLACEMENT - 添加
 * 2. UPDATE    - 更新
 * 3. DELETION  - 删除
 *
 * 对于“添加”和“删除”操作较为简单，直接 appendChild、removeChild，
 * 对于“更新”逻辑，我们借助 updateDom(dom, oldProps, newProps) 函数实现
 */

/**
 * 创建“React 元素”
 * @param {string} type                   元素类型
 * @param {Object} props                  元素参数
 * @param  {(Object | string)[]} children 元素的孩子
 * @returns React 元素
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

  const isProperty = (name) => name !== 'children';

  // 传入的参数赋值到 fiber 上
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

/**
 * 使用 Fiber 更新对应的 DOM
 */
function updateDom(dom, oldProps, newProps) {
  // TODO:
}

/**
 * 从 Fiber 根节点开始，将所有 Fiber 节点提交到 DOM 中
 */
function commitRoot() {
  // 提交被“删除”的 Fiber
  deletions.forEach(commitWork);
  // 提交被“添加、更新”的 Fiber
  commitWork(wipRoot.child);
  oldRoot = wipRoot;
  wipRoot = null;
}

/**
 * 将指定 Fiber 节点提交到 DOM 中
 * @param {Fiber} fiber
 * @returns
 */
function commitWork(fiber) {
  if (!fiber) return;

  const parentDom = fiber.parent.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION' && fiber.dom) {
    parentDom.removeChild(fiber.dom);
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
    // 连接旧的 Fiber 节点
    alternate: oldRoot,
  };
  wipRoot = unitOfWork;
  deletions = [];
}

let unitOfWork = null;
/** 工作中的 Fiber 树 */
let wipRoot = null;
/** 最后已经提交到 DOM 的 Fiber 树 */
let oldRoot = null;
/** 待删除的旧 Fiber */
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
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;

  // 协调 Fiber 与其子元素
  reconcileChildren(fiber, elements);

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

/**
 * 协调“旧 Fiber”与“新元素”
 * @param {Fiber} fiber                         Fiber 节点
 * @param {DetailedReactHTMLElement[]} elements React.crateElement 的返回值数组
 * @returns
 */
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
};

/** @jsx MiniReact.createElement */

const element = (
  <div id="foo">
    <a>bar</a>
    <hr />
  </div>
);

const container = document.getElementById('root');

MiniReact.render(element, container);
