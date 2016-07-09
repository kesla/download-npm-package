import {resolve as resolveHome} from 'home';
import {sync as mkdirp} from 'mkdirp';
import download from './index';

export default ([, , arg, _dir = process.cwd()]) => {
  const dir = resolveHome(_dir);
  mkdirp(dir);
  download({arg, dir})
    .then(() => {
      console.log(`finished downloading ${arg}`);
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};
