/**
 * 实现 commitRoot 函数的逻辑，即“将所有 Fiber 节点统一提交到 DOM”
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
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child),
      ),
    },
  };
}

/**
 * 创建“React 文本元素”
 * @param {string} text 文本值
 * @returns React 文本元素
 */
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * 根据 Fiber 创建 DOM
 * @param {Fiber} fiber Fiber 节点
 * @returns 根据 Fiber 节点创建的 DOM
 */
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== 'children';

  // 传入的参数赋值到 Fiber 上
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
  wipRoot = null;
}

/**
 * 将指定 Fiber 节点提交到 DOM 中
 * @param {Fiber} fiber
 * @returns
 */
function commitWork(fiber) {
  if (!fiber) return;

  const domParent = fiber.parent.dom;

  domParent.appendChild = fiber.dom;
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * 渲染元素
 * @param {JSX.Element} element   需要渲染的元素
 * @param {HTMLElement} container 容器
 * @returns
 */
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null;

/**
 * 在浏览器空闲时间执行任务，没有空闲时间则放弃执行
 * @param {Object} idleDeadline https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 * @param {boolean} idleDeadline.didTimeout     回调是否被调用
 * @param {Function} idleDeadline.timeRemaining 调用后返回“浏览器当前帧剩余的空闲时间”
 * @returns
 */
function workLoop(idleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performNextUnitOfWork(nextUnitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  // 处理完了所有工作，将 Fiber 统一提交到 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

/**
 * 依次处理每个 Fiber 节点
 * @param {Object} fiber          React Fiber
 * @param {string} fiber.type     Fiber 类型
 * @param {Object} fiber.props    Fiber 参数
 * @param {Fiber} fiber.parent    Fiber 父代
 * @param {HTMLElement} fiber.dom Fiber 对应的 DOM
 * @returns 下一个需要处理的 Fiber 节点
 */
function performNextUnitOfWork(fiber) {
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 对于每个孩子，都创建一个 Fiber
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    // 新创建的 Fiber 能成为“孩子”还是“兄弟”，取决于它是否是第一个后代
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  // 搜索 Fiber 树（顺序依次是：孩子、兄弟、父兄弟），返回第一个找到的 Fiber 节点
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');

Didact.render(element, container);
