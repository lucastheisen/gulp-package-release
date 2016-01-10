'use strict';

var fs = require('fs');
var fsExt = require('../util/fsExt');
var git = require('gulp-git');
var gulp = require('gulp');
var path = require('path');
var Q = require('q');
var release = require('../');
var gitPromise = require('../util/gitPromise');

describe('gulp-package-release', function() {
    var originalCwd,
        remoteDir = path.resolve('./test/remote'),
        repoDir = path.resolve('./test/repo');

    after(function() {
        process.chdir(originalCwd);
        fsExt.rmdirs([remoteDir, repoDir]);
    });

    before(function(done) {
        Q.fcall(function() {
                originalCwd = process.cwd();
                fsExt.mkdirs([remoteDir, repoDir]);
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
                    .pipe(git.add())
                    .pipe(git.commit('Initial commit'))
                    .on('finish', function() {
                        deferred.resolve();
                    });

                return deferred.promise;
            })
            .then(function() {
                return gitPromise('addRemote', 
                    ['origin', 'file://' + path.resolve(remoteDir)]);
            })
            .then(function() {
                return gitPromise('push', ['origin', 'master'], {args: '-u'});
            })
            .fail(function(err) {
                throw err;
            })
            .fin(function() {
                done();
            });
    });

    describe('check-status', function() {
        it('should pass to start', function(done) {
            release.checkStatus().then(done).done();
        });
    });
});
