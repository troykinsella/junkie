"use strict";
var gulp = require('gulp');
var git = require('gulp-git');

var commitChangesTask = function() {
  return gulp.src('.')
    .pipe(git.add())
    .pipe(git.commit('chore(release): Release changes'));
};

gulp.task('commit-changes', commitChangesTask);
module.exports = commitChangesTask;
