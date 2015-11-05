"use strict";
var gulp = require('gulp');
var header = require('gulp-header');

var distHeaderTask = function() {
  var pkg = require('../package.json');
  var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

  gulp.src([
    'dist/junkie.js',
    'dist/junkie.min.js'
  ])
    .pipe(header(banner, { pkg : pkg } ))
    .pipe(gulp.dest('dist'));
};

gulp.task('dist-header', distHeaderTask);
module.exports = distHeaderTask;

