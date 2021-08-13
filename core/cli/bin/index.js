#!/usr/bin/env node

/**
 * 脚手架入口文件
 * 1. 判断是否用本地版本
 * 2. 
 */
const importLocal = require('import-local');

if (importLocal(__filename)) {
    require('npmlog').info('cli', '正在使用本地版本');
} else {
    require('../lib')(process.argv.slice(3));
}

// __dirName
// __fileName
// models
// require
// exports