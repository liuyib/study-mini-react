/**
 * 最小实现
 * 1. 手动实现了 React.createElement, ReactDOM.render 方法
 * 2. 告诉 Babel 用我们自定义的 createElement 方法来编译 JSX
 */
// import './step2-render-function/2-3.jsx';

/**
 * 1. 实现 Concurrent Mode
 * 2. 引入 Fiber 架构（采用可中断的遍历方式更新 Fiber Reconciler）
 */
// import './step4-fibers/2-2.jsx';

/**
 * 1. 解决潜在问题：每次处理 Fiber 节点时，都会向 DOM 中添加元素，
 *               因此浏览器可能会打断整个 Fiber 树的渲染，从而可能导致用户看到不完整的 UI
 * 2. 解决方法：处理 Fiber 时，暂时不提交到 DOM 中，等处理完所有 Fiber 后，
 *            再统一将所有 Fiber 提交到 DOM 中
 */
// import './step5-render-and-commit-phases/1-2.jsx';

/**
 * TODO:
 * 1. Reconciliation
 */
// import './step6-reconciliation/2-2.jsx';
