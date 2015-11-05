var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');

var handleErr = function(err) {
  console.log(err.message);
  process.exit(1);
};

var staticTask = function() {
  return gulp.src([
    'lib/**/*.js',
    //'tasks/**/*.js',
    'test/**/*.js'
  ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs())
    .on('error', handleErr);
};

gulp.task('static', staticTask);
module.exports = staticTask;
