/**
 * 告诉 Babel 用自定义的 createElement 去处理 JSX
 */

import ReactDOM from 'react-dom';

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

const MiniReact = {
  createElement,
};

/** @jsx MiniReact.createElement */

const element = (
  <div id="foo">
    <a>bar</a>
    <hr />
  </div>
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
