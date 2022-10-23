/**
 * 实现自定义的 render(element, container) 函数逻辑
 * 1. 与 DOM 交互
 * 2. 递归处理子元素
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
  const dom = document.createElement(element.type);

  element.props.children = element.props.children.map((child) =>
    render(child, dom),
  );

  container.appendChild(dom);
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
