'use strict';

let gulp = require('gulp'),
    gutil = require('gulp-util'),
    filesize = require('gulp-filesize'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    del = require('del'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    templateCache = require('gulp-angular-templatecache'),
    gulpProtractorAngular = require('gulp-angular-protractor'),
    KarmaServer = require('karma').Server,
    shell = require('gulp-shell'),
    argv = require('yargs').argv;

// process.argv is an option for collecting cli arguments, but not ideal.
let browsers = argv.browsers ?
                  argv.browsers.split(',') :
                  // PhantomJS, Chrome, Firefox, etc
                  ['Firefox'];

let match = {
  recurse: '**/*'
};

let baseDir = './',
    src = './src/',
    dist = './dist/',
    demos = './demo/',
    tmp = './.tmp/',
    tmpBuild = tmp + 'build/',
    test = './test/',
    testRelative = '/test/';

let srcAll = src + match.recurse,
    distAll = dist +match.recurse,
    demoAll = demos + match.recurse,
    tmpAll = tmpBuild + match.recurse;

let srcJS = src + match.recurse + '.js',
    srcView = src + '/views/'+ match.recurse + '.html';

let outputJS = 'angular-extension-registry.js',
    outputTpl = 'compiled-templates.js';

let buildSource = [
    src + 'extension-registry.js',
    src + 'constants/extension-registry-utils.js',
    src + 'services/extension-registry-provider.js',
    src + 'directives/extension-point.js',
    src + 'directives/extension-renderer.js'
  ];

let protocol = 'http://',
    host = 'localhost',
    serverPort = 9005,
    // will use when we setup e2e-test
    baseUrl = protocol + host + ':' + serverPort;

let concatSource = (outputDest) => {
  return gulp
          .src(buildSource)
          .pipe(concat(outputJS))
          .pipe(filesize())
          .pipe(gulp.dest(outputDest || dist));
};

let minifyDist = (outputDest) => {
  return gulp
          .src(dist + outputJS)
          .pipe(uglify().on('error', gutil.log))
          .pipe(rename({ extname: '.min.js' }))
          .pipe(filesize())
          .pipe(gulp.dest(outputDest || dist));
};

let cacheTemplates = (outputDest) => {
  return gulp
          .src(srcView)
          .pipe(templateCache({
            module: 'extension-registry'
          }))
          .pipe(rename(outputTpl))
          .pipe(filesize())
          .pipe(gulp.dest(outputDest || dist));
};


gulp.task('clean', () => {
  return del([distAll, tmpAll], (err, paths) => {
    return gutil.log('cleaned files/folders:\n', paths.join('\n'), gutil.colors.green());
  });
});

gulp.task('jshint', () => {
  return gulp
          .src(srcJS)
          .pipe(jshint())
          .pipe(jshint.reporter(stylish));
});

gulp.task('templates', ['clean'], () => {
  return cacheTemplates();
});

gulp.task('build', ['clean','templates', 'jshint'], () => {
  return concatSource();
});

gulp.task('min', ['build', 'templates'], () => {
    return minifyDist();
});

gulp.task('serve', () => {
  browserSync({
     server: {
       baseDir: baseDir
     }
   });

   // TODO: live-reloading for demo not working yet.
   gulp.watch([srcAll, distAll, demoAll], reload);
});


gulp.task('_tmp-build', () => {
  return concatSource(tmpBuild);
});
gulp.task('_tmp-templates', () => {
  return cacheTemplates(tmpBuild);
});

gulp.task('_tmp-min', ['_tmp-build', '_tmp-templates'], () => {
  return minifyDist(tmpBuild);
});


// at present this task exists for travis to use to before
// running ./validate.sh to diff our dist against ./.tmp/build
// and validate that templates have been cached, js minified, etc.
gulp.task('prep-diff', ['_tmp-min'], () => {
  // nothing here atm.
});

gulp.task('validate-dist', ['prep-diff'], () => {
  // validation script to verify ./dist and ./tmp/build are equals
  shell.task([
    './validate.sh'
  ])();
});

// gulp.task('test-e2e', ['serve'], function(callback) {
//     gulp
//         .src(['example_spec.js'])
//         .pipe(gulpProtractorAngular({
//             configFile: test + 'protractor.conf.js',
//             // baseUrl is needed for tests to navigate via relative paths
//             args: ['--baseUrl', baseUrl],
//             debug: false,
//             autoStartStopServer: true
//         }))
//         .on('error', function(e) {
//             console.log(e);
//         })
//         .on('end', callback);
// });

// for integration testing, uses phantomJS
gulp.task('test-unit', (done) => {
    new KarmaServer({
      configFile:  __dirname  + testRelative + 'karma.conf.js',
      port: serverPort,
      browsers: browsers,
    }, done).start();
});

// run all the tests, unit first, then e2e
gulp.task('test', ['test-unit'], () => {
  // just runs the other tests
});

gulp.task('default', ['min', 'serve']);
