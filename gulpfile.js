'use strict';
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var jsdoc = require("gulp-jsdoc");
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var size = require('gulp-size');
var mochaPhantomjs = require('gulp-mocha-phantomjs');

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

gulp.task('pre-test-node', function () {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test-node', ['pre-test-node'], function(cb) {
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
      dir: 'dist/coverage'
    }))
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('test-browser', [ 'browserify-test' ], function() {
  return gulp.src('test/client/index.html')
    .pipe(mochaPhantomjs());
});

// TODO: browserified tests currently pass in the browser, but not $ gulp test-browser
gulp.task('test', [ 'test-node'/*, 'test-browser'*/ ]);

gulp.task('browserify-lib', [ 'static' ], function() {
  return gulp.src('lib/junkie.js')
    .pipe(browserify({
      insertGlobals: true,
      standalone: 'junkie'
    }))
    .pipe(size({
      title: "Uncompressed"
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('browserify-test', [ 'static' ], function() {
  return gulp.src('test/client/index.js')
    .pipe(browserify({
      insertGlobals: true
    }))
    .pipe(rename('junkie-test.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('uglify', [ 'browserify-lib' ], function() {
  return gulp.src('dist/junkie.js')
    .pipe(uglify())
    .pipe(rename('junkie.min.js'))
    .pipe(size({
      title: "Compressed"
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch('lib/**/*.js', [ 'browserify-lib' ]);
  gulp.watch('test/**/*.js', [ 'browserify-test' ]);
});

gulp.task('default', ['static', 'test', 'uglify', 'docs']);
