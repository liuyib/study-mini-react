/**
 * 手动实现 createElement 函数
 */

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
  React.createElement('b'),
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
