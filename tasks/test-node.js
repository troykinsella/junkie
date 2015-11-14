"use strict";
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');

var preTestNodeTask = function() {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
};

var testNodeTask = function(cb) {
  var mochaErr;

  gulp.src([
      'test/integration/*.js',
      'test/unit/*.js'
    ])
    .pipe(plumber())
    .pipe(mocha({
      reporter: 'spec'
    }))
    .on('error', function(err) {
      mochaErr = err;
    })
    .pipe(istanbul.enforceThresholds({
      thresholds: {
        global: 100
      }
    }))
    .pipe(istanbul.writeReports({
      dir: 'dist/coverage'
    }))
    .on('end', function () {
      cb(mochaErr);
    });
};

gulp.task('pre-test-node', preTestNodeTask);
gulp.task('test-node', ['pre-test-node'], testNodeTask);
module.exports = testNodeTask; // TODO: pre?
