var gulp = require('gulp');
var sass = require('gulp-sass');
// gulp-plumber prevent pipe breaking caused by errors from gulp plugins.
var plumber = require('gulp-plumber');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var uncss = require('gulp-uncss');

// compliles sass stylesheets
gulp.task('sass', function() {
  gulp.src('public/stylesheets/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(uncss({
      html: [
        'public/index.html',
        'public/views/add.html',
        'public/views/detail.html',
        'public/views/home.html',
        'public/views/login.html',
        'public/views/signup.html'
      ]
    }))
    .pipe(csso())
    .pipe(gulp.dest('public/stylesheets'));
});

gulp.task('compress', function() {
  gulp.src([
    'public/vendor/angular.js',
    'public/vendor/*.js',
    'public/app.js',
    'public/services/*.js',
    'public/controllers/*.js',
    'public/filters/*.js',
    'public/directives/*.js'
  ])
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public'));
});

// This task will create a file templates.js in the public directory that we have to include in the index.html in order for AngularJS to detect it.
gulp.task('templates', function() {
  gulp.src('public/views/**/*.html')
    .pipe(templateCache({ root: 'views', module: 'MyApp' }))
    .pipe(gulp.dest('public'));
});

// watch the file changes, and recompile automatically.
gulp.task('watch', function() {
  gulp.watch('public/stylesheets/*.scss', ['sass']);
  gulp.watch('public/views/**/*.html', ['templates']);
  // Gulp will watch for all JavaScript files in the  public directory except for app.min.js or any files in the  vendor directory.
  gulp.watch(['public/**/*.js', '!public/app.min.js', '!public/templates.js', '!public/vendor'], ['compress']);
});

// gulp tasks. It will run when you execute gulp command in the terminal.
gulp.task('default', ['sass', 'compress', 'templates', 'watch']);
