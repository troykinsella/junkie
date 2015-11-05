"use strict";
var gulp = require('gulp');
var git = require('gulp-git');

var tagReleaseTask = function(cb) {
  var version = require('../package.json').version;
  git.tag(version, 'chore(release): Tagged ' + version, function(error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', { args: '--tags' }, cb);
  });
};

gulp.task('tag-release', tagReleaseTask);
module.exports = tagReleaseTask;
