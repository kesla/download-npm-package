import {resolve as resolveHome} from 'home';
import {sync as mkdirp} from 'mkdirp';
import download from './index';

export default ([, , arg, _path = process.cwd()]) => {
  const path = resolveHome(_path);
  mkdirp(path);
  download({arg, path})
    .then(() => {
      console.log(`finished downloading ${arg}`);
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};
