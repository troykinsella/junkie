"use strict";
var gulp = require('gulp');
var git = require('gulp-git');

var pushChangesTask = function(cb) {
  git.push('origin', 'master', cb);
};

gulp.task('push-changes', pushChangesTask);
module.exports = pushChangesTask;
