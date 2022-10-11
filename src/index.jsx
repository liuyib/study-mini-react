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
 * Reconciliation
 *
 * 1. 主要逻辑如下：
 *    a. 更新 Fiber 上的属性
 *    b. 通过对比新旧 Fiber 树，打标记（effectTag）
 * 2. 为了实现“对比新旧 Fiber 树”，需要用变量保存“最后一次提交到 DOM 的 Fiber 树”
 * 3. 在 commit 阶段，会根据 effectTag 标记，完成 DOM 的添加、更新、删除
 */
// import './step6-reconciliation/3-3.jsx';

/**
 * Function Components
 *
 * 1. 其主要特点如下：
 *    a. 没有对应的 DOM 节点
 *    b. 无法通过 props 获取 children，而是通过执行函数来获取
 * 2. 在 commit 阶段，由于函数组件没有对应的 DOM，因此需要以下特殊处理：
 *    a. 添加 DOM，沿着 Fiber 一直往上找，直到找到具有 DOM 的 Fiber
 *    b. 删除 DOM，沿着 Fiber 一直往下找，递归删除所有子代 DOM
 */
// import './step7-function-components/2-3.jsx';

/**
 * Hooks
 *
 * 以最基础的 useState 举例，实现逻辑如下：
 * 1. 初始一个全局变量，用于保存 useState 的初始值，以便后续使用
 * 2. 在 Fiber 上添加一个 hooks 属性，用于记录一个组件中多个 Hooks 的索引，
 *    以支持在同一个组件中多次调用 Hooks
 * 3. 在函数组件中调用 Hooks 时，做如下处理：
 *    a. 检查是否有一个旧的 Hook（wipRoot.alternate.hooks[hookIndex] 有值，则表明有旧 Hook）
 *    b. 如果有旧 Hook，将其状态复制给新 Hook；否则，用初始值给新 Hook 状态赋值
 *    c. 触发 setState 函数时，其内部使用队列，将接收新状态保存到全局的 wipFiber 上
 *    d. 重置 wipRoot 和 nextUnitOfWork 以触发新的渲染
 *    e. 重新渲染时，同步骤「a」检查是否有旧的 Hook
 *    f. 如果有旧 Hook（oldHook），其 queue 属性里保存的就是“上一次渲染中，使用 setState 更新的状态值”
 *    g. 遍历 oldHook.queue，用该队列里的状态值依次赋值给"新 Hook 的状态
 *    c. 返回“新 Hook 的状态”和“setState 函数”
 */
import './step8-hooks/2-3.jsx';
