"use strict";
var gulp = require('gulp');
var mochaPhantomjs = require('gulp-mocha-phantomjs');

gulp.task('test-browser', [ 'browserify-test' ], function() {
  return gulp.src('test/client/index.html')
    .pipe(mochaPhantomjs());
});
