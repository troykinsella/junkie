"use strict";
var gulp = require('gulp');
var conventionalChangelog = require('gulp-conventional-changelog');

var changeLogTask = function() {
  return gulp.src('CHANGELOG.md', {
    buffer: false
  })
    .pipe(conventionalChangelog({
      preset: 'angular',
      releaseCount: 0
    }))
    .pipe(gulp.dest('./'));
};

gulp.task('changelog', changeLogTask);
module.exports = changeLogTask;
