"use strict";
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var size = require('gulp-size');

var browserifyTask = function() {
  return browserify('lib/junkie.js')
    .bundle({
      insertGlobals: true,
      exclude: 'buffer',
      standalone: 'junkie'
    })
    .on('error', function(err) {
      gutil.log(err);
    })
    .pipe(source('junkie.js'))
    .pipe(size({
      title: "Uncompressed"
    }))
    .pipe(gulp.dest('dist'))
};

gulp.task('browserify', [ 'static' ], browserifyTask);
module.exports = browserifyTask;
