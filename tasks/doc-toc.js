"use strict";
var gulp = require('gulp');
var toc = require('gulp-doctoc');

var docTocTask = function() {
  return gulp.src('README.md')
    .pipe(toc({
      title: ' '
    }))
    .pipe(gulp.dest('./'));
};

gulp.task('doc-toc', docTocTask);
module.exports = docTocTask;
