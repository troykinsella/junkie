"use strict";
var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");
var config = require('../task-config').tasks.docs;

gulp.task('docs', function() {
  return gulp.src(config.src)
    .pipe(jsdoc(config.dest));
});
