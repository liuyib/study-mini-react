const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello',
  },
};

// ReactDOM.render(element, container);
// 被替换为以下代码：

const container = document.getElementById('root');

const node = document.createElement(element.type);
node['title'] = element.props.title;

const text = document.createTextNode('');
text['nodeValue'] = element.props.children;

node.appendChild(text);
container.appendChild(node);
