'use strict';
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var jsdoc = require("gulp-jsdoc");
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var size = require('gulp-size');

var handleErr = function (err) {
  console.log(err.message);
  process.exit(1);
};

gulp.task('docs', function() {
  return gulp.src("./lib/**/*.js")
    .pipe(jsdoc('./dist/docs'));
});

gulp.task('static', function () {
  return gulp.src([
      'lib/**/*.js',
      'test/**/*.js'
    ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs())
    .on('error', handleErr);
});

gulp.task('pre-test', function () {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function(cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({
      reporter: 'spec'
    }))
    .on('error', function(err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports({
      dir: './dist/coverage'
    }))
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('browserify', function() {
  return browserify('./lib/junkie.js', { standalone: 'junkie' })
    .bundle()
    .pipe(source('junkie.js'))
    //.pipe(size())
    .pipe(gulp.dest('./dist'))
});

gulp.task('uglify', [ 'browserify' ], function() {
  return gulp.src('./dist/junkie.js')
    .pipe(uglify())
    //.pipe(size())
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['static', 'test', 'docs']);
