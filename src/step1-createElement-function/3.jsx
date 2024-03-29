/**
 * 手动实现 createElement 函数
 */

import React from 'react';
import ReactDOM from 'react-dom';

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
}

const element = React.createElement(
  'div',
  {
    id: 'foo',
  },
  React.createElement('a', null, 'bar'),
  React.createElement('hr'),
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
