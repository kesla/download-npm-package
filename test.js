import {createGzip} from 'zlib';
import http from 'http';

import Promise from 'bluebird';
import test from 'tapava';
import tar from 'tar-stream';
import shutdown from 'http-shutdown';
import tmp from 'tmp';

import {inject} from './lib';

const setupHttpServer = async onRequest => {
  const server = await new Promise(resolve => {
    const _server = http.createServer(onRequest).listen(0, () => resolve(_server));
  });

  shutdown(server);

  return {
    shutdown: () => new Promise(resolve => {
      server.shutdown(resolve);
    }),
    baseUrl: `http://localhost:${server.address().port}`
  };
};

const createTmpDir = Promise.promisify(tmp.dir);

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
  const dir = await createTmpDir();
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
  const dir = await createTmpDir();
  const arg = 'foo';
  await inject(getPackage)({arg, dir});
  await shutdown();
});
