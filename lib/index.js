import 'babel-polyfill';
import getRegistryUrl from 'registry-url';
import getAuthToken from 'registry-auth-token';
import npa from 'npm-package-arg';
import got from 'got';
import {wrap as co} from 'co';
import Promise from 'bluebird';
import eos from 'end-of-stream';
import {Gunzip} from 'zlib';
import {Extract} from 'tar';
import tmp from 'tmp';
import {rename} from 'then-fs';
import {join as joinPath} from 'path';
import rimraf from 'rimraf-then';
import mkdirp from 'mkdirp-then';

const makeParentDir = (path, scope) => {
  return scope ? mkdirp(joinPath(path, scope)) : mkdirp(path);
};

module.exports = co(function * ({arg, path}) {
  const [tmpPath, cleanupCallback] = yield Promise.promisify(callback => tmp.dir(callback));
  const {scope, name, _rawSpec} = npa(arg);
  const rawSpec = _rawSpec || 'latest';
  const registryUrl = getRegistryUrl(scope);
  const authToken = getAuthToken(registryUrl);
  const url = `${registryUrl}${name.replace(/\//g, '%2F')}/${rawSpec}`;
  const headers = authToken ? {
    authorization: 'Bearer ' + authToken
  } : {};

  const {body: pkg} = yield got(url, {headers, json: true});
  const {dist: {tarball}} = pkg;

  yield Promise.promisify(callback => {
    eos(
      got
        .stream(tarball, {headers})
        .pipe(new Gunzip())
        .pipe(new Extract(tmpPath)),
      callback
    );
  });

  yield makeParentDir(path, scope);
  yield rimraf(joinPath(path, name));
  yield rename(joinPath(tmpPath, 'package'), joinPath(path, name));
  cleanupCallback();
});
