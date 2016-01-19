'use strict';

var gulp = require('gulp');
var publish = require('.').npmPublish;
var Q = require('q');
var release = require('.').release;
var spawn = require('child_process').spawn;

gulp.task('release', function() {
    return release(
        {
            releaseCallback: function(answers) {
                return publish({access: 'public'});
            }
        });
});
