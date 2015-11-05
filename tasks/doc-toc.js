"use strict";
var gulp = require('gulp');
var spawn = require('child_process').spawn;

var docTocTask = function(done) {
  spawn('doctoc', [ 'README.md' ], { stdio: 'inherit' }).on('close', done);
};

gulp.task('doc-toc', docTocTask);
module.exports = docTocTask;
