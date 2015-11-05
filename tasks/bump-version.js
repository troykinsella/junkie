"use strict";
var gulp = require('gulp');
var gutil = require('gulp-util');
var bump = require('gulp-bump');

var minimist = require('minimist');
var knownOptions = {
  string: 'type',
  default: {
    type: 'patch'
  }
};

var options = minimist(process.argv.slice(2), knownOptions);

function bumpVersionTask() {
  return gulp.src('package.json')
    .pipe(bump({ type: options.type }).on('error', gutil.log))
    .pipe(gulp.dest('./'));
}

gulp.task('bump-version', bumpVersionTask);
module.exports = bumpVersionTask;
