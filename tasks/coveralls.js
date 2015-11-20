"use strict";
var gulp = require('gulp');
var coveralls = require('gulp-coveralls');

var coverallsTask = function() {
  return gulp.src('dist/coverage/lcov.info')
    .pipe(coveralls());
};

gulp.task('coveralls', coverallsTask);
module.exports = coverallsTask;
