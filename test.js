import test from 'tapava';
import {inject} from './lib';
import tar from 'tar-stream';
import http from 'http';
import shutdown from 'http-shutdown';
import {createGzip} from 'zlib';
import tmp from 'tmp';
import Promise from 'bluebird';

const setupHttpServer = function * (onRequest) {
  const server = yield new Promise(resolve => {
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

test('downloadNewPackage', function * (t) {
  const {baseUrl, shutdown} = yield setupHttpServer((req, res) => {
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
  const [dir] = yield Promise.promisify(callback => tmp.dir(callback));
  const arg = 'foo';
  yield inject(getPackage)({arg, dir});
  yield shutdown();
});

test('downloadNewPackage, none standard location in tar', function * (t) {
  const {baseUrl, shutdown} = yield setupHttpServer((req, res) => {
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
  const [dir] = yield Promise.promisify(callback => tmp.dir(callback));
  const arg = 'foo';
  yield inject(getPackage)({arg, dir});
  yield shutdown();
});
