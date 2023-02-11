/**
 * 1. 从 performUnitOfWork 函数中提取出“创建新 Fiber”的逻辑，声明为 reconcileChildren 函数
 * 2. 在 reconcileChildren 中将会协调“旧 Fiber”和“新元素”
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
 * 从 Fiber 根节点开始，将所有 Fiber 节点提交到 DOM 中
 */
function commitRoot() {
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

  parentDom.appendChild(fiber.dom);
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
}

let unitOfWork = null;
/** 工作中的 Fiber 树 */
let wipRoot = null;
/** 最后已经提交到 DOM 的 Fiber 树 */
let oldRoot = null;

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

    // TODO: compare oldFiber to element

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
