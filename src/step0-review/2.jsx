import ReactDOM from 'react-dom';

// const element = <h1 title="foo">Hello</h1>;
// 被替换为以下代码：

// const element = React.createElement(
//   'h1',
//   {
//     title: 'foo',
//   },
//   'Hello',
// );

// => React.createElement 根据参数返回一个对象，因此又可以替换成以下代码：
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello',
  },
};

const container = document.getElementById('root');

ReactDOM.render(element, container);
