/**
 * 实现 performUnitOfWork 函数逻辑，用于将 Fiber 转化成真实的 DOM。具体过程如下：
 * 1. 使用 Fiber 创建一个新的节点，并添加到 DOM 中
 * 2. 对于每个孩子，都创建一个 Fiber。新创建的 Fiber 能成为“孩子”还是“兄弟”，
 *    取决于它是否是第一个后代
 * 3. 搜索 Fiber 树（顺序依次是：孩子、兄弟、父兄弟），返回第一个找到的 Fiber 节点
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

function render(element, container) {
  unitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

let unitOfWork = null;

function workLoop(idleDeadline) {
  let shouldYield = false;

  while (unitOfWork && !shouldYield) {
    unitOfWork = performUnitOfWork(unitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 添加到 DOM 中
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
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
    <hr />
  </div>
);

const container = document.getElementById('root');

MiniReact.render(element, container);
