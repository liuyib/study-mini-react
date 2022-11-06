/**
 * 实现 Fiber 架构（上一个文件是原理，不涉及代码）
 * 1. 将 render 函数更改为 createDom(Fiber)，用于“使用传入的 Fiber 创建 DOM”
 * 2. 重新声明一个 render 函数，用于“设置下一个工作单元”，也就是按照 Fiber 架构来执行代码
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

// 根据 Fiber 创建 DOM
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== 'children';

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

// 在浏览器空闲时间执行任务，没有空闲时间则放弃执行
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

// 在浏览器空闲时间需要执行的任务
function performUnitOfWork(fiber) {
  // TODO: add dom node
  // TODO: create new Fibers
  // TODO: return next unit of work
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
