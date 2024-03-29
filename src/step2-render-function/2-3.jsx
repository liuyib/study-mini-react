/**
 * 实现自定义的 render(element, container) 函数逻辑
 * 1. 与 DOM 交互
 *   1.1 处理 element 为 `TEXT_ELEMENT` 类型的元素的情况
 *   1.2 把元素的参数分配给创建的节点
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
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = (name) => name !== 'children';

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
