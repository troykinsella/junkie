"use strict";
var gulp = require('gulp');
var gutil = require('gulp-util');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');

var staticTask = function() {
  return gulp.src([
    'lib/**/*.js',
    'tasks/**/*.js',
    'test/**/*.js'
  ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs())
    .on('error', gutil.log);
};

gulp.task('static', staticTask);
module.exports = staticTask;
