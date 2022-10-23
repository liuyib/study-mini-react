/**
 * 在开始实现 Concurrent Mode 之前，先重构下代码：
 * 1. 调整 render 中的递归实现（如果递归生成的元素树过大，会阻塞浏览器渲染）
 * 2. 用循环代替递归，以便可以停止任务
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

function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = (key) => key !== 'children';

  // 传入的参数赋值到 DOM 上
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // 递归处理子项
  element.props.children = element.props.children.map((child) =>
    render(child, dom),
  );

  container.appendChild(dom);
}

let nextUnitOfWork = null;

// 在浏览器空闲时间执行任务，没有空闲时间则放弃执行
function workLoop(idleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performNextUnitOfWork(nextUnitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

// 在浏览器空闲时间需要执行的任务
function performNextUnitOfWork(nextUnitOfWork) {
  // TODO: ...
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
