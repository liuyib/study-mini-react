import ReactDOM from 'react-dom';

const element = (
  <div id="foo">
    <a>bar</a>
    <hr />
  </div>
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
