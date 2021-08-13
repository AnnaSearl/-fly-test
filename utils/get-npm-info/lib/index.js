'use strict';

const semver = require('semver');
const axios = require('axios');
const urlJoin = require('url-join');

module.exports = {
    getNpmInfo,
    getNpmSemverVersion,
};

function getNpmInfo(pkgName, registry) {
    if (!pkgName) return null;
    const registerUrl = registry || getDefaultRegistry();
    const npmInfoUrl = urlJoin(registerUrl, pkgName);
    return axios.get(npmInfoUrl).then((response) => {
        if (response.status === 200) {
            return  response.data;
        }
        return null;
    }).catch((err) => {
        return Promise.reject(err);
    });
}

function getDefaultRegistry(isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    if (data) {
        return Object.keys(data.versions);
    }
    return [];
}

function getSemverVersions(baseVersion, versions) {
    return versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => semver.gt(b, a));
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    const semverVersions = getSemverVersions(baseVersion, versions);
    if (semverVersions && semverVersions.length > 0) {
        return semverVersions[0];
    }
}