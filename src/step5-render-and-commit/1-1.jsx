/**
 * 解决潜在的问题：
 * 每次处理 Fiber 节点时，都会向 DOM 中添加元素，因此浏览器可能会打断整个 Fiber 树的渲染，
 * 从而可能导致用户看到不完整的 UI
 *
 * 解决方法：
 * 删除改变 DOM 的代码，执行完所有任务后，统一将 Fiber 提交到 DOM
 *
 * 解决步骤：
 * 用变量保存“根 Fiber 节点”，当结束了所有工作后，再统一将 Fiber 提交到 DOM 上。具体步骤如下：
 * 1. wipRoot 变量保存“根 Fiber 节点”
 * 2. 在 workLoop 中添加判断，当“没有下一个工作单元”并且“存在工作中的根”时，统一将 Fiber 提交到 DOM
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

function commitRoot() {
  // TODO: add nodes to dom
}

/**
 * 渲染元素
 * @param {JSX.Element} element   需要渲染的元素
 * @param {HTMLElement} container 容器
 * @returns
 */
function render(element, container) {
  unitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
  wipRoot = unitOfWork;
}

let unitOfWork = null;
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

/**
 * 依次处理每个 Fiber 节点
 * @param {Object} fiber          React Fiber
 * @param {string} fiber.type     Fiber 类型
 * @param {Object} fiber.props    Fiber 参数
 * @param {HTMLElement} fiber.dom Fiber 对应的 DOM
 * @param {Fiber} fiber.parent    Fiber 的父代
 * @param {Fiber} fiber.child     Fiber 的第一个孩子
 * @param {Fiber} fiber.sibling   Fiber 的兄弟
 * @returns 下一个需要处理的 Fiber 节点
 */
function performUnitOfWork(fiber) {
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 对于每个孩子，都创建一个 Fiber
  const elements = fiber.props.children;
  let prevSibling = null;

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: fiber,
    };

    // 新创建的 Fiber 能成为“孩子”还是“兄弟”，取决于它是否是第一个后代
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
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

const MiniReact = {
  createElement,
  render,
};

/** @jsx MiniReact.createElement */

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');

MiniReact.render(element, container);
