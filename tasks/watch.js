"use strict";
var gulp = require('gulp');

var watchTask = function() {
  gulp.watch('lib/**/*.js', [ 'browserify' ]);
  gulp.watch('test/**/*.js', [ 'browserify-test' ]);
};

gulp.task('watch', watchTask);
module.exports = watchTask;
