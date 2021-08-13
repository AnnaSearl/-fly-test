'use strict';

const semver = require('semver');
const color = require('colors')
const rootCheck = require('root-check');
const userHome = require('user-home');
const pathExists = require('path-exists');
const constant = require('./const');
const pkg = require('../package.json');
const path = require('path');
const log = require('@fly-test/log');
const { getNpmInfo, getNpmSemverVersion } = require('@fly-test/get-npm-info');

// 获取 cli 当前版本号
function checkPkgVersion() {
  log.success(`版本号 ${pkg.version}`);
}

// 检查当前运行环境的 node 版本是否低于 @fly-test/cli 所支持的最低版本号
function checkLowestNodeVersion() {
  const currentVersion = process.version; // 当前运行版本
  const lowestNodeVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestNodeVersion)) {
    throw new Error(color.red(`需要安装 v${lowestNodeVersion} 以上版本的 Node.js`));
  }
}

// 检查 root 权限
function checkRoot() {
  log.success(rootCheck());
  log.success(process.geteuid());
}

// 检查用户目录
function checkUserHome() {
  console.log(userHome);
  if (!userHome || !pathExists(userHome)) {
    throw new Error(color.red('当前用户目录不存在'));
  }
}

// 检查输入参数
function checkInputArgs() {
  const minimist = require('minimist');
  const args = minimist(process.argv.slice(2));
  checkArgs(args);
  console.log(args)
}

// 根据变量改变日志等级
function checkArgs(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  log.level = process.env.LOG_LEVEL;
}

function createDefaultEnvConfig() {
  const cliConfig = {
    home: userHome,
  }
  if(process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  // 路径存在才生成
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultEnvConfig();
  log.verbose('环境变量', process.env.CLI_HOME_PATH);
}

async function checkGlobalUpdate() {
  // 1.获取当前版本号和包名称
  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  // 2.调用npm api 获取线上版本信息
  const lastVersion = await getNpmSemverVersion(pkgVersion, pkgName);
  console.log(lastVersion)
  // 3.提取所有版本号，对比
  if (lastVersion && semver.gt(lastVersion, pkgVersion)) {
    log.warn(color.yellow(`请手动更新 ${pkgName} 当前版本：${pkgVersion}，最新版本${lastVersion}
        更新命令：npm install -g ${pkgName}`))
  }
}

async function core() {
  // 使用 try catch 来避免打印出错误堆栈信息
  try {
    // const info = await getNpmInfo("@vue/cli");
    // console.log(info);
    checkPkgVersion();
    checkLowestNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
    log.verbose('DEBUG', 'Debug 模式启动');
  } catch (e) {
    log.error(e.message);
  }
}

module.exports = core;
