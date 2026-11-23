// 按构建环境选择 JSX 转换模式：开发态保留 react-dev-inspector 与 dev JSX，
// 生产态必须关闭 preset-react.development，否则会走 jsxDEV（生产 React 不导出）导致预渲染崩溃。
module.exports = (api) => {
  const isDevelopment = api.env('development');
  api.cache.using(() => isDevelopment);
  return {
    presets: [
      ['next/babel', { 'preset-react': { development: isDevelopment } }],
    ],
    plugins: isDevelopment ? ['@react-dev-inspector/babel-plugin'] : [],
  };
};
