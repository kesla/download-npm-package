# download-npm-package

Download a module from the npm registry.

## Installation

```shell
npm [-g] install download-npm-package
```

## Features

* Library to download packages
* CLI to download packages
* Will use registry (and auth) defined in your `.npmrc` file
* Supports scoped packages

## Usage

### node

*downloadNpmPackage* takes an package arg & a path as arguments and returns a promise, a promise that resolves once the package has been downloaded to the folder set in path.

```js
import downloadNpmPackage from 'download-npm-package';

downloadNpmPackage({
  arg: 'modulname@version' // for example, npm@2 or @mic/version@latest etc
  dir: '/tmp' // package will be downlodaded to ${dir}/packageName
}).then()
```

### cli

There's also a cli available!

```shell
download-npm-package $packageArg [$path]
```
