import {createGzip} from 'zlib';

import test from 'tapava';
import tar from 'tar-stream';
import setupHttpServer from 'http-test-server';
import tmp from 'then-tmp';

import {inject} from './lib';

test('downloadNewPackage', async t => {
  const {baseUrl, shutdown} = await setupHttpServer((req, res) => {
    t.is(req.url, '/tarballs/foo-123.tgz');
    const pack = tar.pack();
    pack.entry({name: 'package/package.json'}, JSON.stringify({name: 'foo', version: '123'}));
    pack.finalize();
    pack.pipe(createGzip()).pipe(res);
  });
  const getPackage = arg => {
    t.is(arg, 'foo');
    return Promise.resolve({
      dist: {
        tarball: `${baseUrl}/tarballs/foo-123.tgz`
      }
    });
  };
  const {path: dir} = await tmp.dir();
  const arg = 'foo';
  await inject(getPackage)({arg, dir});
  await shutdown();
});

test('downloadNewPackage, none standard location in tar', async t => {
  const {baseUrl, shutdown} = await setupHttpServer((req, res) => {
    t.is(req.url, '/tarballs/foo-123.tgz');
    const pack = tar.pack();
    pack.entry({name: 'foo/package.json'}, JSON.stringify({name: 'foo', version: '123'}));
    pack.finalize();
    pack.pipe(createGzip()).pipe(res);
  });
  const getPackage = arg => {
    t.is(arg, 'foo');
    return Promise.resolve({
      dist: {
        tarball: `${baseUrl}/tarballs/foo-123.tgz`
      }
    });
  };
  const {path: dir} = await tmp.dir();
  const arg = 'foo';
  await inject(getPackage)({arg, dir});
  await shutdown();
});
