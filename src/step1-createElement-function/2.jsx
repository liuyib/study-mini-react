/**
 * 使用 React.createElement 转换 JSX 语法
 */

import React from 'react';
import ReactDOM from 'react-dom';

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
