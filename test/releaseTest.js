'use strict';

var chai = require('chai'),should = chai.should();
var fs = require('fs');
var fsExt = require('../util/fsExt');
var git = require('gulp-git');
var gitCommitAndPush = require('../util/gitCommitAndPush');
var gitPromise = require('../util/gitPromise');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var Q = require('q');
var release = require('../');
var releasePromise = release.releasePromise;

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
                fs.writeFileSync(path.join(repoDir, 'package.json'), 
                    '{"version": "0.0.1-SNAPSHOT"}');
                process.chdir(repoDir);
            })
            .then(function() {
                return gitPromise('init', [], {args: '--quiet --bare', cwd: remoteDir});
            })
            .then(function() {
                return gitPromise('init', [], {args: '--quiet'});
            })
            .then(function() {
                return gitPromise('addRemote', 
                    ['origin', 'file://' + remoteDir], {quiet: false});
            })
            .then(function() {
                return gitCommitAndPush('.', 'Initial commit', {push: 'push -u origin master'});
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
                    .on('end', function(err) {
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
            return release.checkStatus();
        });

        it('should fail with Uncommitted', function() {
            return Q.fcall(function() {
                    fs.writeFileSync(path.join(currentRepoDir, 'index.html'), '<html></html>');
                })
                .then(function() {
                    return release.checkStatus();
                })
                .then(
                    function(value) {
                        should.fail();
                    },
                    function(err) {
                        err.message.indexOf('Uncommitted ').should.equal(0);
                    }
                );
        });

        it('should fail with Latest changes not pushed', function() {
            var index = path.join(currentRepoDir, 'index.html');

            return Q.fcall(function() {
                    fs.writeFileSync(index, '<html></html>');
                })
                .then(function() {
                    var deferred = Q.defer();

                    gulp.src(index)
                        .pipe(git.add({quiet: true}))
                        .pipe(git.commit('Commit index', {quiet: true}))
                        .on('end', function() {
                            deferred.resolve();
                        });

                    return deferred.promise;
                })
                .then(function() {
                    return release.checkStatus();
                })
                .then(
                    function(value) {
                        should.fail();
                    },
                    function(err) {
                        gutil.log('Error: %s', err);
                        err.message.indexOf('Latest changes not pushed to remote').should.equal(0);
                    }
                );
        });

        it('should pass after push', function() {
            var index = path.join(currentRepoDir, 'index.html');

            return Q.fcall(function() {
                    fs.writeFileSync(index, '<html></html>');
                })
                .then(function() {
                    return gitCommitAndPush('index.html', 'Commit index');
                })
                .then(function() {
                    return release.checkStatus();
                });
        });
    });

    describe('release', function() {
        it('should pass after release', function() {
            var index = path.join(currentRepoDir, 'index.html'),
                packageDotJson = path.join(currentRepoDir, 'package.json');

            return Q.fcall(function() {
                    fs.writeFileSync(index, '<html></html>');
                })
                .then(function() {
                    return gitCommitAndPush('index.html', 'Commit index');
                })
                .then(function() {
                    return release.checkStatus();
                })
                .then(function() {
                    return releasePromise({
                        withPrompt: function(prompt) {
                            prompt.rl.emit('line', '0.0.1');
                            prompt.rl.emit('line', 'v0.0.1');
                            prompt.rl.emit('line', '0.0.2-SNAPSHOT');
                        },
                        cwd: currentRepoDir,
                        files: [packageDotJson],
                        releaseCallback: function() {
                            require(packageDotJson).version.should.equal('0.0.1');
                        }
                    });
                })
                .then(function() {
                    require(packageDotJson).version.should.equal('0.0.1');
                });
        });
    });
});
