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
import getPackageJsonFromRegistry from 'get-package-json-from-registry';

const makeParentDir = (dir, scope) => {
  return scope ? mkdirp(joinPath(dir, scope)) : mkdirp(dir);
};

module.exports = co(function * ({arg, dir}) {
  const [tmpPath, cleanupCallback] = yield Promise.promisify(callback => tmp.dir(callback));
  const {scope, name} = npa(arg);
  const registryUrl = getRegistryUrl(scope);
  const authToken = getAuthToken(registryUrl);
  const headers = authToken ? {
    authorization: 'Bearer ' + authToken
  } : {};

  const pkg = yield getPackageJsonFromRegistry()(arg);
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

  yield makeParentDir(dir, scope);
  yield rimraf(joinPath(dir, name));
  yield rename(joinPath(tmpPath, 'package'), joinPath(dir, name));
  cleanupCallback();
});
