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
var spawn = require('child_process').spawn;
var runSequence = require('gulp-sequence');

var handleErr = function (err) {
  console.log(err.message);
  process.exit(1);
};

function npmVersion(type, done) {
  spawn('npm', ['version', type], { stdio: 'inherit' }).on('close', done);
}

function gitPush(file, message, optional, done) {
  spawn('git', [ 'add', file ], { stdio: 'inherit' }).on('close', function() {
    spawn('git', [ 'commit', '-m', message ], { stdio: 'inherit' }).on('close', function(err) {
      if (optional) {
        done();
      } else {
        done(err);
      }
    });
  });
}

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

gulp.task('test', [ 'test-node', 'test-browser' ]);

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

gulp.task('npm-version-patch', function(done) {
  npmVersion('patch', done);
});
gulp.task('npm-version-minor', function(done) {
  npmVersion('minor', done);
});
gulp.task('npm-version-major', function(done) {
  npmVersion('major', done);
});

gulp.task('npm-publish', function(done) {
  spawn('npm', [ 'publish' ], { stdio: 'inherit' }).on('close', done);
});

gulp.task('git-push-dist', function(done) {
  gitPush('dist', 'Updated distribution files', false, done);
});

gulp.task('git-push-tags', function(done) {
  spawn('git', [ 'push', '--follow-tags' ], { stdio: 'inherit' }).on('close', done);
});

gulp.task('doctoc', function(done) {
  spawn('doctoc', [ 'README.md' ], { stdio: 'inherit' }).on('close', done);
});

gulp.task('git-push-readme', function(done) {
  gitPush('README.md', 'Updated readme', true, done);
});

function release(type, done) {
  runSequence(
    'default',
    'doctoc',
    'git-push-readme',
    'git-push-dist',
    'npm-version-' + type,
    'git-push-tags',
    'npm-publish',
    done
  );
}

gulp.task('release-patch', release.bind(null, 'patch'));
gulp.task('release-minor', release.bind(null, 'minor'));
gulp.task('release-major', release.bind(null, 'major'));

gulp.task('default', ['static', 'test', 'uglify', 'docs']);
