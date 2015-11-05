var gulp = require('gulp');
var config = require('../task-config').tasks.watch;

var watchTask = function() {
  gulp.watch('lib/**/*.js', [ 'browserify' ]);
  gulp.watch('test/**/*.js', [ 'browserify-test' ]);
};

gulp.task('watch', watchTask);
module.exports = watchTask;
