import getRegistryUrl from 'registry-url';
import getAuthToken from 'registry-auth-token';
import npa from 'npm-package-arg';
import getPackage from 'get-package-json-from-registry';
import downloadTarball from 'download-package-tarball';

const inject = getPackage => async ({arg, dir}) => {
  const {scope} = npa(arg);
  const registryUrl = getRegistryUrl(scope);
  const {token} = getAuthToken(registryUrl) || {};
  const headers = token ? {
    authorization: `Bearer ${token}`
  } : {};

  const pkg = await getPackage(arg);
  const {dist: {tarball}} = pkg;

  await downloadTarball({url: tarball, gotOpts: {headers}, dir});
};

module.exports = inject(getPackage);
module.exports.inject = inject;
