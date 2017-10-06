var gulp = require('gulp');
var sass = require('gulp-sass');

 
gulp.task('sass', function () {
  gulp.src('./editor/modules/materializecss/sass/materialize.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./editor/modules/materializecss/css'));
  return gulp.src('./editor/src/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./editor/css'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch(['./editor/src/scss/*.scss', './editor/modules/materializecss/sass/*/*.scss'], ['sass']);
});

gulp.task('build', ['sass', 'sass:watch']);
