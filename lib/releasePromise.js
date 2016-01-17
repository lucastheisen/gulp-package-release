'use strict';

var bump = require('gulp-bump');
var checkStatus = require('./checkStatus');
var gitCommitAndPush = require('../util/gitCommitAndPush');
var gulp = require('gulp');
var gutil = require('gulp-util');
var Q = require('q');
var queryUser = require('../util/queryUser');

var bumpRelease = function(answers, options) {
    var deferred = Q.defer(),
        promise = deferred.promise,
        options = options || {},
        message = options.releaseMessage || 'Updating release version',
        files = options.files || ['bower.json', 'package.json'],
        cwd = options.cwd || '.';

    gutil.log('Processing [%s] in [%s]', files, cwd);
    gulp.src(files, {'cwd': cwd})
        .pipe(bump({'version': answers.version}))
        .pipe(gulp.dest('.', {'cwd': cwd}))
        .on('end', function() {
            deferred.resolve();
        });

    return promise
        .then(function() {
            return gitCommitAndPush(files, message, 
                {tag: answers.tag})
        });
};

var bumpSnapshot = function(answers, options) {
    var deferred = Q.defer(),
        promise = deferred.promise,
        options = options || {},
        message = options.snapshotMessage || 'Updating next snapshot version',
        files = options.files || ['bower.json', 'package.json'],
        cwd = options.cwd || '.';

    gutil.log('Processing [%s] in [%s]', files, cwd);
    gulp.src(files, {'cwd': cwd})
        .pipe(bump({'version': answers.nextVersion}))
        .pipe(gulp.dest('.', {'cwd': cwd}))
        .on('end', function() {
            deferred.resolve();
        });

    return promise
        .then(function() {
            return gitCommitAndPush(files, message);
        });
};

module.exports = function(options) {
    var options = options || {};

    return checkStatus()
        .then(function() {
            return queryUser(options);
        })
        .then(function(answers) {
            var promise = bumpRelease(answers, options);
            if (options.releaseCallback) {
                promise = promise
                    .then(function() {
                        return options.releaseCallback();
                    })
                    .then(function() {
                        return answers;
                    });
            }
            return promise;
        })
        .then(function(answers) {
            return bumpSnapshot(answers, options);
        })
        .then(function(value) {
            gutil.log('Done!');
        });
};
