"use strict";
var gulp = require('gulp');
var spawn = require('child_process').spawn;

var npmPublishTask = function(done) {
  spawn('npm', [ 'publish' ], { stdio: 'inherit' }).on('close', done);
};

gulp.task('npm-publish', npmPublishTask);
