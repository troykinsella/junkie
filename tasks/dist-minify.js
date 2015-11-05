"use strict";
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var size = require('gulp-size');
var rename = require('gulp-rename');

var compressTask = function() {
  return gulp.src('dist/junkie.js')
    .pipe(uglify())
    .pipe(rename('junkie.min.js'))
    .pipe(size({
      title: "Compressed"
    }))
    .pipe(gulp.dest('dist'));
};

gulp.task('dist-minify', [ 'browserify' ], compressTask);
module.exports = compressTask;
