'use strict';

var git = require('gulp-git');
var gitPromise = require('./gitPromise');
var gulp = require('gulp');
var gutil = require('gulp-util');
var Q = require('q');

module.exports = function(files, message, options) {
    var deferred = Q.defer(),
        promise = deferred.promise,
        options = options || {},
        push = options.push || 'push';

    gulp.src(files)
        .pipe(git.add())
        .pipe(git.commit(message))
        .on('end', function() {
            deferred.resolve();
        });

    if (options.tag) {
        promise = promise
            .then(function() {
                gutil.log('tagging as [%s]', options.tag);
                return gitPromise('tag', [options.tag, options.tag]);
            })
            .then(function() {
                gutil.log('pushing tag');
                return gitPromise('exec', [], {args: 'push --follow-tags'});
            });
    }

    return promise
        .then(function() {
            gutil.log('pushing');
            return gitPromise('exec', [], {args: push});
        });
};
