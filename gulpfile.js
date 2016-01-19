'use strict';

var gulp = require('gulp');
var spawn = require('child_process').spawn;
var Q = require('q');
var release = require('.').release

gulp.task('release', function() {
    return release(
        {
            releaseCallback: function(answers) {
                var deferred = Q.defer();
                spawn('node', 
                    ['node_modules/npm/bin/npm-cli.js', 'publish', '.', '--tag', answers.tag, '--access', 'public'], 
                    {
                        stdio: 'inherit'
                    })
                    .on('close', function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        deferred.resolve();
                    });
                return deferred.promise;
            }
        });
});
