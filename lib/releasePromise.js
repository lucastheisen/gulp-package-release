'use strict';

var gitPromise = require('../util/gitPromise');
var gulp = require('gulp');

var commitAndPush = function() {
    var deferred = Q.defer();
    gulp.src(['./bower.json', './package.json'])
        .pipe(git.add())
        .pipe(git.commit('Updating next snapshot version'))
        .on('finish', function() {
            git.exec({args: 'push'}, function (err, stdout) {
                if (err) {
                    return deferred.reject(err);
                }
                if (stdout) {
                    console.log("Pushed\n" + stdout);
                }
                deferred.resolve()
            });
        });
    return deferred.promise;
}

var tagAndPush = function(tag, version) {
    var deferred = Q.defer();
    gulp.src(['./bower.json', './package.json'])
        .pipe(git.add())
        .pipe(git.commit('Updating release version'))
        .on('finish', function() {
            git.tag(tag, "Release " + version, function(err) {
                if (err) {
                    return deferred.reject(err);
                }
                git.push('origin', tag, function (err, stdout) {
                    if (err) {
                        return deferred.reject(err);
                    }
                    deferred.resolve()
                });
            });
        });
    return deferred.promise;
}

var bumpRelease = function(answers) {
    var deferred = Q.defer();
    gulp.src(['./bower.json', './package.json'])
        .pipe(bump({'version': answers.version}))
        .pipe(gulp.dest('.'))
        .on('finish', function() {
            tagAndPush(answers.tag, answers.version)
                .then(function() {
                    deferred.resolve(answers);
                })
            .done();
        });
    return deferred.promise;
}

var bumpSnapshot = function(answers) {
    var deferred = Q.defer();
    gulp.src(['./bower.json', './package.json'])
        .pipe(bump({'version': answers.nextVersion}))
        .pipe(gulp.dest('.'))
        .on('finish', function() {
            commitAndPush()
                .then(function() {
                    deferred.resolve(answers);
                })
            .done();
        });
    return deferred.promise;
}

var queryUser = function() {
    var deferred = Q.defer(),
    bowerDotJson = require('./bower.json');
    inquirer.prompt([
        {
            type: 'input',
            name: 'version',
            message: 'Release version: ',
            default: bowerDotJson.version
        },
        {
            type: 'input',
            name: 'tag',
            message: 'Tag: ',
            default: function(answers) {
                return 'event-analyzer-' + answers.version;
            }
        },
        {
            type: 'input',
            name: 'nextVersion',
            message: 'Next version: ',
            default: function(answers) {
                return semver.inc(answers.version, 'patch', false) + '-SNAPSHOT';
            }
        }], function(answers) {
            deferred.resolve(answers);
        });
    return deferred.promise;
}

module.exports = function() {
    return queryUser()
        .then(function(answers) {
            return bumpRelease(answers);
        })
        .then(function(answers) {
            return bumpSnapshot(answers);
        })
        .then(function(value) {
            console.log("Done!");
        });
}
