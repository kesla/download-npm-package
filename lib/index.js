import getRegistryInfo from 'registry-info';
import npa from 'npm-package-arg';
import getPackage from 'get-package-json-from-registry';
import downloadTarball from 'download-package-tarball';

const inject = getPackage => async ({arg, dir}) => {
  const {scope} = npa(arg);
  const {authorization} = getRegistryInfo(scope);
  const headers = authorization ? {authorization} : {};

  const pkg = await getPackage(arg);
  const {dist: {tarball}} = pkg;

  await downloadTarball({url: tarball, gotOpts: {headers}, dir});
};

module.exports = inject(getPackage);
module.exports.inject = inject;
