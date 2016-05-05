"use strict";
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var browserifyTestTask = function() {
  return browserify('test/client/index.js')
    .bundle({
      insertGlobals: true
    })
    .on('error', function(err) {
      gutil.log(err);
    })
    .pipe(source('junkie-test.js'))
    .pipe(gulp.dest('dist'));
};

gulp.task('browserify-test', [ 'static' ], browserifyTestTask);
module.exports = browserifyTestTask;
