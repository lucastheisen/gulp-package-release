'use strict';

var fs = require('fs');
var fsExt = require('../util/fsExt');
var git = require('gulp-git');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var Q = require('q');
var release = require('../');
var gitPromise = require('../util/gitPromise');

describe('gulp-package-release', function() {
    var originalCwd,
        runDir = path.resolve('./test/run'),
        baseDir = path.resolve(path.join(runDir, 'base')),
        remoteDir = path.resolve(path.join(baseDir, 'remote')),
        repoDir = path.resolve(path.join(baseDir, 'repo')),
        currentDir = path.resolve(path.join(runDir, 'current')),
        currentRemoteDir = path.resolve(path.join(currentDir, 'remote')),
        currentRepoDir = path.resolve(path.join(currentDir, 'repo'));

    after(function() {
        return Q.fcall(function() {
                gutil.log('begin after');
                process.chdir(originalCwd);
            })
            .then(function() {
                return fsExt.rmdirs([runDir]);
            })
            .then(function() {
                gutil.log('end after');
            });
    });

    afterEach(function() {
        return Q.fcall(function() {
                gutil.log('begin afterEach');
                process.chdir(originalCwd);
            })
            .then(function() {
                return fsExt.rmdirs([currentDir]);
            })
            .then(function() {
                gutil.log('end afterEach');
            });
    });

    before(function() {
        return Q.fcall(function() {
                gutil.log('begin before');
                originalCwd = process.cwd();
            })
            .then(function() {
                return fsExt.mkdirs([runDir, baseDir, remoteDir, repoDir]);
            })
            .then(function() {    
                fs.writeFileSync(path.join(repoDir, 'README.md'), 'h1. Test');
                process.chdir(repoDir);
            })
            .then(function() {
                return gitPromise('init', [], {args: '--quiet --bare', cwd: remoteDir});
            })
            .then(function() {
                return gitPromise('init', [], {args: '--quiet'});
            })
            .then(function() {
                var deferred = Q.defer();

                gulp.src('.')
                    .pipe(git.add({quiet: false}))
                    .pipe(git.commit('Initial commit', {quiet: false}))
                    .on('finish', function() {
                        deferred.resolve();
                    });

                return deferred.promise;
            })
            .then(function() {
                return gitPromise('addRemote', 
                    ['origin', 'file://' + remoteDir], {quiet: false});
            })
            .then(function() {
                return gitPromise('push', ['origin', 'master'], {args: '-u', quiet: false});
            })
            .then(function() {
                gutil.log('end before');
            });
    });

    beforeEach(function() {
        return Q.fcall(function() {
                var deferred = Q.defer();
                gutil.log('begin beforeEach');

                gulp.src(path.join(baseDir, '**'), {dot: true})
                    .pipe(gulp.dest(currentDir))
                    .on('finish', function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        process.chdir(currentRepoDir);
                        deferred.resolve();
                    });

                return deferred.promise;
            })
            .then(function() {
                return gitPromise('exec', [],
                    {args: 'remote set-url origin file://' + currentRemoteDir});
            })
            .then(function() {
                gutil.log('end beforeEach');
            });
    });

    describe('checkStatus', function() {
        it('should pass to start', function() {
            return release.checkStatus().then();
        });
    });
});
