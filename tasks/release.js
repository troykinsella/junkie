"use strict";
var gulp = require('gulp');
var runSequence = require('gulp-sequence');

var releaseTask = runSequence(
  // TODO: fail if workspace is dirty
  'dist',
  'bump-version',
  'changelog',
  'doc-toc',
  'commit-changes',
  'push-changes',
  'tag-release',
  'npm-publish'
);

gulp.task('release', releaseTask);
