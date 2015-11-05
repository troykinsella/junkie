"use strict";
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

var browserifyTestTask = function() {
  return gulp.src('test/client/index.js')
    .pipe(browserify({
      insertGlobals: true
    }))
    .pipe(rename('junkie-test.js'))
    .pipe(gulp.dest('dist'));
};

gulp.task('browserify-test', [ 'static' ], browserifyTestTask);
module.exports = browserifyTestTask;
