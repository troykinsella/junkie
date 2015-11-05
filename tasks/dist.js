var gulp = require('gulp');
var runSequence = require('gulp-sequence');

var distTask = runSequence(
  [ 'static', 'test-node' ],
  [ 'browserify', 'browserify-test' ],
  [ 'test-browser', 'dist-minify', 'docs' ],
  'dist-header');

gulp.task('dist', distTask);
module.exports = distTask;
