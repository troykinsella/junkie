"use strict";
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var size = require('gulp-size');

var browserifyTask = function() {
  return gulp.src('lib/junkie.js')
    .pipe(browserify({
      insertGlobals: true,
      standalone: 'junkie'
    }))
    .pipe(size({
      title: "Uncompressed"
    }))
    .pipe(gulp.dest('dist'));
};

gulp.task('browserify', [ 'static' ], browserifyTask);
module.exports = browserifyTask;
