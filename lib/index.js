import getRegistryUrl from 'registry-url';
import getAuthToken from 'registry-auth-token';
import npa from 'npm-package-arg';
import {wrap as co} from 'co';
import getPackage from 'get-package-json-from-registry';
import downloadTarball from 'download-package-tarball';

const inject = getPackage => co(function * ({arg, dir}) {
  const {scope} = npa(arg);
  const registryUrl = getRegistryUrl(scope);
  const authToken = getAuthToken(registryUrl);
  const headers = authToken ? {
    authorization: 'Bearer ' + authToken
  } : {};

  const pkg = yield getPackage(arg);
  const {dist: {tarball}} = pkg;

  yield downloadTarball({url: tarball, gotOpts: {headers}, dir});
});

module.exports = inject(getPackage);
module.exports.inject = inject;
