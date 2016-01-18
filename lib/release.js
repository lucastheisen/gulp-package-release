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
        opts = options || {},
        message = opts.releaseMessage || 'Updating release version',
        files = opts.files || ['bower.json', 'package.json'],
        cwd = opts.cwd || '.';

    gutil.log('Bumping version to [%s] in [%s] (folder is [%s])', 
        answers.version, files, cwd);

    gulp.src(files, {'cwd': cwd})
        .pipe(bump({'version': answers.version}))
        .pipe(gulp.dest('.', {'cwd': cwd}))
        .on('end', function() {
            deferred.resolve();
        });

    return promise
        .then(function() {
            return gitCommitAndPush(files, message, 
                {tag: answers.tag});
        });
};

var bumpSnapshot = function(answers, options) {
    var deferred = Q.defer(),
        promise = deferred.promise,
        opts = options || {},
        message = opts.snapshotMessage || 'Updating next snapshot version',
        files = opts.files || ['bower.json', 'package.json'],
        cwd = opts.cwd || '.';

    gutil.log('Bumping version to [%s] in [%s] (folder is [%s])', 
        answers.nextVersion, files, cwd);

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
    options = options || {};

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
