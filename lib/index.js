import getRegistryUrl from 'registry-url';
import getAuthToken from 'registry-auth-token';
import npa from 'npm-package-arg';
import got from 'got';
import {wrap as co} from 'co';
import Promise from 'bluebird';
import eos from 'end-of-stream';
import {Gunzip} from 'zlib';
import tmp from 'tmp';
import {rename} from 'then-fs';
import {join as joinPath} from 'path';
import rimraf from 'rimraf-then';
import mkdirp from 'mkdirp-then';
import getPackage from 'get-package-json-from-registry';
import {extract} from 'tar-fs';

const makeParentDir = (dir, scope) => {
  return scope ? mkdirp(joinPath(dir, scope)) : mkdirp(dir);
};

const inject = getPackage => co(function * ({arg, dir}) {
  const [tmpPath, cleanupCallback] = yield Promise.promisify(callback => tmp.dir(callback));
  const {scope, name} = npa(arg);
  const registryUrl = getRegistryUrl(scope);
  const authToken = getAuthToken(registryUrl);
  const headers = authToken ? {
    authorization: 'Bearer ' + authToken
  } : {};

  const pkg = yield getPackage(arg);
  const {dist: {tarball}} = pkg;

  yield Promise.promisify(callback => {
    eos(
      got
        .stream(tarball, {headers})
        .pipe(new Gunzip())
        .pipe(extract(tmpPath)),
      callback
    );
  });

  yield makeParentDir(dir, scope);
  yield rimraf(joinPath(dir, name));
  try {
    yield rename(joinPath(tmpPath, 'package'), joinPath(dir, name));
  } catch (err) {
    yield rename(joinPath(tmpPath, name), joinPath(dir, name));
  }
  cleanupCallback();
});

module.exports = inject(getPackage);
module.exports.inject = inject;
