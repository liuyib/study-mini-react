const fs = require('fs');
const path = require('path');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const packageJson = require(resolveApp('package.json'));

const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  packageJson.homepage,
  process.env.PUBLIC_URL,
);

module.exports = {
  publicUrlOrPath,
};
