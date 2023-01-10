/**
 * 为了组织工作单元，需要引入一种数据结构：Fiber 树。如下所示：
 *
 * 有 JSX 结构如下：
 * <div>
 *   <h1>
 *     <p />
 *     <a />
 *   </h1>
 *   <h2 />
 *   <h3 />
 *   <h4 />
 * </div>
 *
 * 转换成 Fiber 树如下：
 * root
 *  ↓↑
 * <div>
 *  ↓↑  ↖       ↖       ↖
 * <h1> → <h2> → <h3> → <h4>
 *  ↓↑  ↖
 * <p>  → <a>
 *
 * Fiber 节点的数据结构如下：
 * {
 *   type?: string;
 *   props?: Object;
 *   dom?: HTMLElement;
 *   parent?: Fiber;
 *   child?: Fiber;
 *   sibling?: Fiber;
 *   alternate?: Fiber;
 *   effectTag?: string;
 * }
 *
 * Fiber 架构的工作过程（原理）如下：
 * 1. 执行完当前 Fiber 上的任务后，首先使用“第一个孩子”作为下一个工作单元
 * 2. 如果没有孩子，则使用“下一个兄弟”作为下一个工作单元
 * 3. 如果没有下一个兄弟，则向上查找“父亲的下一个兄弟”
 * 4. 如果父亲没有下一个兄弟，则以此类推，继续向上查找，直到找到 root
 * 5. 当找到 root 时，表明执行完了这次渲染时的所有任务
 *
 * 对于每个 Fiber 会执行以下三件事：
 * 1. 添加元素到 DOM 上
 * 2. 创建元素孩子的 Fibers
 * 3. 选择下一个工作单元
 *
 * 使用 Fiber 架构的一个目的是：使得查找下一个工作单元更容易。
 * 这就是为什么 Fiber 树中，每个 Fiber 都有指向它的“第一个孩子”、“下一个兄弟”和“父亲”的连接。
 */

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

function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = (key) => key !== 'children';

  // 传入的参数赋值到 DOM 上
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // 递归处理子项
  element.props.children = element.props.children.map((child) =>
    render(child, dom),
  );

  container.appendChild(dom);
}

let unitOfWork = null;

// 在浏览器空闲时间执行任务，没有空闲时间则放弃执行
function workLoop(idleDeadline) {
  let shouldYield = false;

  while (unitOfWork && !shouldYield) {
    unitOfWork = performUnitOfWork(unitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

// 在浏览器空闲时间需要执行的任务
function performUnitOfWork(unitOfWork) {
  // TODO: ...
}

const MiniReact = {
  createElement,
  render,
};

/** @jsx MiniReact.createElement */

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');

MiniReact.render(element, container);
