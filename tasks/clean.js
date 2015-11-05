"use strict";
var gulp = require('gulp');
var clean = require('gulp-clean');

var cleanTask = function() {
  return gulp.src('dist', { read: false })
    .pipe(clean());
};

gulp.task('clean', cleanTask);
module.exports = cleanTask;
