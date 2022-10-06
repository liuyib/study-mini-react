/**
 * 使用 React.createElement 转换 JSX 语法
 */

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
