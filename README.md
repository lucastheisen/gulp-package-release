# gulp-package-release
This plugin provides two different functions used to provide a standardized approach to releasing modules: `checkStatus` and `release`.  Both functions return a `promise` which can easily be integrated with gulp tasks.  The `release` function actually calls `checkStatus` itself in order to ensure that your repo is currently in the same state as its upstream repo.

## Installation
Simply install the same as any other module:
```javascript
npm install gulp-package-release
```
Or, better yet, just add as a `devDependency` in your `package.json` or `bower.json`.
```javascript
{
    ...
    "version": ">1.0.0"
    ...
}
```

## Usage
These functions are intended to be run inside of `gulp` tasks.  For example:
```javascript
var release = require('gulp-package-release').release;

gulp.task('release', function() {
    return release();
});
```
Or:
```javascript
var checkStatus = require('gulp-package-release').checkStatus;

gulp.task('status', function() {
    return checkStatus();
});
```
Or:
```javascript
var npmPublish = require('gulp-package-release').npmPublish;

gulp.task('publish', function() {
    return npmPublish();
});
```
Or combine a couple:
```javascript
var gpr = require('gulp-package-release'),
    publish = gpr.npmPublish,
    release = gpr.release;


gulp.task('publish', function() {
    return release(
        {
            releaseCallback: function(answers) {
                return publish({access: 'public'});
            }
        });
});
```

### checkStatus()
Ensures that all code in the project is committed, and that the HEAD is the same as the upstream HEAD.

```javascript
checkStatus();
```

### npmPublish()
Spawns an `npm publish` command.  See the [npm publish](https://docs.npmjs.com/cli/publish) documentation for more information.

```javascript
npmPublish([options]);
```
#### options
Type: `Object`
##### options.access
Type: `String`
Tells the registry whether this package should be published as `public` or `restricted`.
##### options.folder
Type: `String`
The folder to publish to npm
##### options.tag
Type: `String`
Registers the published package with the given tag, such that npm install <name>@<tag> will install this version.
##### options.tarball
Type: `String`
The tarball to publish to npm

### release(options)
Performs the following tasks in order:

1. Verifies status using `checkStatus`
2. Asks the user for the release version, tag name, and next version (if not supplied as options) 
3. Updates the release version in `package.json`, or list of files from `options.files` (using release verison from step 2)
4. Commits and pushes the modified file(s)
5. Creates, commits, and pushes an annotated tag (using name from step 2 for both name and message)
6. Calls `releaseCallback` if specified
7. Updates the next version in both `package.json`, or list of files from `options.files` (using next verison from step 2)
8. Commits and pushes the modified file(s)

This procedure allows you to always develop your project using pre-release version numbers until you are ready to cut a release.  Only during the release will the version number be non-pre-release.  The `releaseCallback` can be used to do any additional packaging and publishing using the tagged version of the code.

```javascript
release([options]);
```
#### options
Type: `Object`
##### options.answers
Type: `Object`
An object containing answers to any of the three interactive questions:
1. `version`: The release version
2. `tag`: The tag name
3. `nextVersion`:  The next development version
If an answer is provided, the _corresponding_ question will not be asked.  For example: 
```javascript
{
    "version": "1.0.1",
    "tag": "v1.0.1",
    "nextVersion": "1.0.2-SNAPSHOT"
}
```
If an answer is not provided for a question, the user will be prompted to answer it _interactively_.  For example:
```javascript
{
    "version": "1.0.1",
}
```
In this case, the user will be asked for a `tag` and for the `nextVersion`.
##### options.files
Type: `Array` or `String`  Default: `['package.json']`
Glob or array of globs to read. Globs use [node-glob](https://github.com/isaacs/node-glob) syntax except that negation is fully supported.  Should point to `JSON` files containing a `version` property.
##### options.releaseCallback
Type: `Function`
A function to be called during the release process after the release tag has been committed and pushed, but before the version has been updated to the next version.  This would be useful if you plan on publishing to an artifact repository (like npm or maven).

