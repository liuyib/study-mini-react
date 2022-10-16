/**
 * 支持函数组件
 * 1. 首先修改 DEMO 例子
 * 2. 函数组件主要有两点不同
 *    a. 来源于函数组件的 Fiber 没有对应的 DOM 节点
 *    b. 通过执行函数来获取 children，而不是从 props 中获取
 * 3. 为了支持函数组件，添加 updateFunctionComponent 函数，用于更新函数组件到 DOM
 */

import PropTypes from 'prop-types';
import { isNil } from '../utils/isType.js';

/**
 * 创建“React 元素”
 * @param {string} type                   元素类型
 * @param {Object} props                  元素参数
 * @param  {(Object | string)[]} children 元素的孩子
 * @returns React 元素
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child),
      ),
    },
  };
}

/**
 * 创建“React 文本元素”
 * @param {string} text 文本值
 * @returns React 文本元素
 */
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * 根据 Fiber 创建 DOM
 * @param {Fiber} fiber Fiber 节点
 * @returns 根据 Fiber 节点创建的 DOM
 */
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (key) => key.startsWith('on');
const isProperty = (key) => key !== 'children' && !isEvent(key);
const isGone = (prev, next) => (key) => prev[key] && !next[key];
// “next 中有新的键”或“prev 和 next 中相同键的值不同”
const isNew = (prev, next) => (key) => prev[key] !== next[key];

/**
 * 使用 Fiber 更新对应的 DOM
 */
function updateDom(dom, prevProps, nextProps) {
  // 移除旧事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      // onClick -> click
      const eventType = name.toLowerCase().substring(2);

      dom.removeEventListener(eventType, prevProps[name]);
    });
  // 添加新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);

      dom.addEventListener(eventType, nextProps[name]);
    });

  // 移除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = '';
    });
  // 添加新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
}

/**
 * 从 Fiber 根节点开始，将所有 Fiber 节点提交到 DOM 中
 */
function commitRoot() {
  // 提交被“删除”的 Fiber
  deletions.forEach(commitWork);
  // 提交被“添加、更新”的 Fiber
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

/**
 * 将指定 Fiber 节点提交到 DOM 中
 * @param {Fiber} fiber
 * @returns
 */
function commitWork(fiber) {
  if (!fiber) return;

  const domParent = fiber.parent.dom;

  if (fiber.effectTag === 'PLACEMENT' && !isNil(fiber.dom)) {
    domParent.appendChild(fiber.dom);
  }
  if (fiber.effectTag === 'UPDATE' && !isNil(fiber.dom)) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  if (fiber.effectTag === 'DELETION' && !isNil(fiber.dom)) {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * 渲染元素
 * @param {JSX.Element} element   需要渲染的元素
 * @param {HTMLElement} container 容器
 * @returns
 */
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 连接旧的 Fiber 节点
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
}

let nextUnitOfWork = null;
/** 最后已经提交到 DOM 的 Fiber 树 */
let currentRoot = null;
/** 工作中的 Fiber 树 */
let wipRoot = null;
/** 待删除的旧 Fiber */
let deletions = null;

/**
 * 在浏览器空闲时间执行任务，没有空闲时间则放弃执行
 * @param {Object} idleDeadline https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 * @param {boolean} idleDeadline.didTimeout     回调是否被调用
 * @param {Function} idleDeadline.timeRemaining 调用后返回“浏览器当前帧剩余的空闲时间”
 * @returns
 */
function workLoop(idleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performNextUnitOfWork(nextUnitOfWork);
    // 1: 1ms，同 requestIdleCallback 回调函数接收的参数中 timeRemaining() 返回值的单位
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  // 处理完了所有工作，将 Fiber 统一提交到 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

/**
 * 依次处理每个 Fiber 节点
 * @param {Object} fiber          React Fiber
 * @param {string} fiber.type     Fiber 类型
 * @param {Object} fiber.props    Fiber 参数
 * @param {HTMLElement} fiber.dom Fiber 对应的 DOM
 * @param {Fiber} fiber.parent    Fiber 的父代
 * @param {Fiber} fiber.child     Fiber 的第一个孩子
 * @param {Fiber} fiber.sibling   Fiber 的兄弟
 * @returns 下一个需要处理的 Fiber 节点
 */
function performNextUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 搜索 Fiber 树（顺序依次是：孩子、兄弟、父兄弟），返回第一个找到的 Fiber 节点
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

/**
 * 更新函数式组件
 * @param {Fiber} fiber
 * @returns
 */
function updateFunctionComponent(fiber) {
  // TODO:
}

/**
 * 更新非函数式组件
 * @param {Fiber} fiber
 * @returns
 */
function updateHostComponent(fiber) {
  // 使用 Fiber 创建一个新的节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 协调 Fiber 与其子元素
  reconcileChildren(fiber, fiber.props.children);
}

/**
 * 协调“旧 Fiber”与“新元素”
 * @param {Fiber} wipFiber                      Fiber 节点
 * @param {DetailedReactHTMLElement[]} elements React.crateElement 的返回值数组
 * @returns
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;

  while (index < elements.length || !isNil(oldFiber)) {
    const element = elements[index];
    let newFiber = null;

    // 对比“旧 Fiber”与“新元素”，步骤如下：
    // 1. 如果 type 一致，证明 DOM 节点不需要变，只更新参数
    // 2. 如果“type 不同”并且“新元素存在”，则需要创建新的 DOM 节点
    // 3. 如果“type 不同”并且“存在旧的 Fiber”，则需要删除旧的 DOM 节点
    //
    // 注：React 在这里会用 key 来对比，以判断“节点在元素数组中换了位置”

    const sameType = oldFiber?.type === element?.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        // 在后面 commit 阶段将会用到这个属性
        effectTag: 'UPDATE',
      };
    }
    if (!sameType && element) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (!sameType && oldFiber) {
      oldFiber.effectTag = 'DELETION';
      // 对于需要删除的旧 Fiber，我们不再把他连接到新 Fiber 上（新 Fiber 以 wipRoot 为根），
      // 当我们用 wipRoot 把 Fiber 树提交到 DOM 时，其上没有“旧 Fiber”，
      // 因此需要用数组把所有“旧 Fiber”保存下来
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 新创建的 Fiber 能成为“孩子”还是“兄弟”，取决于它是否是第一个后代
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>;
}

// https://reactjs.org/docs/typechecking-with-proptypes.html
App.propTypes = {
  name: PropTypes.string,
};

const element = <App name="foo" />;
const container = document.getElementById('root');

Didact.render(element, container);
