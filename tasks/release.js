var gulp = require('gulp');
var runSequence = require('gulp-sequence');





/*function release(type, done) {
  runSequence(
    'dist',
    'doctoc',
    'git-push-readme',
    'git-push-dist',
    'npm-version-' + type,
    'git-push-tags',
    'npm-publish',
    done
  );
}*/

var releaseTask = runSequence(
  // TODO: fail if workspace is dirty
  'dist',
  'bump-version',
  'changelog',
  'doc-toc'/*,
  'commit-changes',
  'push-changes',
  'tag-release',
  'npm-publish'*/
);

/*gulp.task('release-patch', release.bind(null, 'patch'));
gulp.task('release-minor', release.bind(null, 'minor'));
gulp.task('release-major', release.bind(null, 'major'));*/

gulp.task('release', releaseTask);
