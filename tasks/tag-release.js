"use strict";
var gulp = require('gulp');
var git = require('gulp-git');

function getPackageJsonVersion() {
  // We parse the json file instead of using require because require caches
  // multiple calls so the version number won't be updated
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

var tagReleaseTask = function(cb) {
  var version = getPackageJsonVersion();
  git.tag("v" + version, 'chore(release): Tagged ' + version, function(error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', { args: '--tags' }, cb);
  });
};

gulp.task('tag-release', tagReleaseTask);
module.exports = tagReleaseTask;
