'use strict';

var gulp = require('gulp');
var npm = require('npm');
var Q = require('q');
var release = require('.').release

gulp.task('release', function() {
    return release(
        {
            releaseCallback: function() {
                var deferred = Q.defer();
                npm.publish(['.'], false, 
                    function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        deferred.resolve();
                    });
                return deferred.promise;
            }
        });
});
