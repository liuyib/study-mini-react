/**
 * 声明 createTextElement 函数，处理 createELement 中是原始值的 children
 */

import React from 'react';
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

const element = React.createElement(
  'div',
  {
    id: 'foo',
  },
  React.createElement('a', null, 'bar'),
  React.createElement('b'),
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
