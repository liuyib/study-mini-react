/**
 * 替换 React 命名空间
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

const element = MiniReact.createElement(
  'div',
  {
    id: 'foo',
  },
  MiniReact.createElement('a', null, 'bar'),
  MiniReact.createElement('hr'),
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
