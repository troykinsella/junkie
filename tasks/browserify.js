"use strict";
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var browserifyTask = function() {
  return browserify('lib/junkie.js', {
    insertGlobals: true,
    standalone: 'junkie'
  }).exclude('buffer')
    .bundle()
    .on('error', function(err) {
      gutil.log(err);
    })
    .pipe(source('junkie.js'))
    .pipe(gulp.dest('dist'));
};

gulp.task('browserify', [ 'static' ], browserifyTask);
module.exports = browserifyTask;
