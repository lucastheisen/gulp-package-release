'use strict';

var gulp = require('gulp');
var release = require('.').release

gulp.task('release', function() {
    return release();
});
