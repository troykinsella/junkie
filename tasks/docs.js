"use strict";
var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc3");
var config = require('../task-config').tasks.docs;

gulp.task('docs', function(cb) {
  gulp.src(config.src, { read: false })
    .pipe(jsdoc({
      opts: {
        destination: config.dest
      }
    }, cb))
});
