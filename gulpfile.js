'use strict';

var gulp = require('gulp'),
    debug = require('gulp-debug'),
    inject = require('gulp-inject'),
    tsc = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    rimraf = require('gulp-rimraf'),
    Config = require('./gulpfile.config'),
    watch = require('gulp-watch'),
    connect = require('gulp-connect');
var traceur = require('gulp-traceur');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

var config = new Config();

gulp.task('webserver', function() {
    connect.server({
        livereload: true,
        root: config.dist.path,
        port: 9000
    });
});

gulp.task('livereload', ['webserver'], function() {
    var files = [ config.dist.allFiles ];
    gulp.src(files)
        .pipe(watch(files))
        .pipe(connect.reload());
});

/*
 * Moves only the necessary dependencys handled by Bower to scripts folder
 */
gulp.task('bower-dependencies', function() {
   
    var mainBowerFiles  = require('main-bower-files');
    var bowerNormalizer = require('gulp-bower-normalize');

    return gulp.src(mainBowerFiles(), {base: config.bowerComponents})
        .pipe(bowerNormalizer({bowerJson: './bower.json'}))
        .pipe(rename(function(path) {
            //console.log(path);
            if (path.dirname.match(/font$/)) {
                //console.log('font');
                path.dirname = 'font';
            } else if (path.dirname.match(/js$/)) {
                //console.log('js');
                path.dirname = '';
            } else if (path.dirname.match(/map$/)) {
                //console.log('map');
                path.dirname = '';
            } else if (path.dirname.match(/css$/)) {
                //console.log('css');
                path.dirname = 'css';
            } 
        }))
        .pipe(gulp.dest(config.dist.pathLibs));
});

gulp.task('angular2', function() {

    var src = config.nodeModules + 'angular2/es6/dev';

    //transpile & concat
    return gulp.src([ src + '/*.es6', src + '/src/**/*.es6'], {base: src})
        .pipe(rename(function(path) {
            path.dirname = 'angular2/' + path.dirname; //this is not ideal... but not sure how to change angular's file structure
            path.extname = ''; //hack, see: https://github.com/sindresorhus/gulp-traceur/issues/54
        }))
        .pipe(traceur({modules: 'instantiate', moduleName: true}))
        .pipe(concat('angular2.js'))
        .pipe(gulp.dest(config.dist.pathLibs));
});

/**
 * Generates the app.d.ts references file dynamically from all application *.ts files.
 */
gulp.task('gen-ts-refs', function () {
    var sources = gulp.src([config.src.ts], {read: false});
    return gulp.src(config.dtsApp)
            .pipe(inject(sources, {
                starttag: '//{',
                endtag: '//}',
                transform: function (filepath) {
                    return '/// <reference path="../..' + filepath + '" />';
                }
            }))
            .pipe(gulp.dest(config.typings));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', ['gen-ts-refs'], function () {
    var sourceTsFiles = [config.src.ts,                       //path to typescript files
                         config.dtsLibs, //reference to library .d.ts files
                         config.dtsApp];     //reference to app.d.ts files

    var tsResult = gulp.src(sourceTsFiles)
                       .pipe(sourcemaps.init())
                       .pipe(tsc({
                           target: 'ES5',
                           module: 'system',
                           declarationFiles: false,
                           noExternalResolve: true,
                           noLib: false,
                           noImplicitAny: true,
                           emitDecoratorMetadata: true,
                           declaration: false,
                           sourceMap: true,                       
                           listFiles: true,
                           typescript: require('typescript') // Used to exchange the default version of Typescript compiler
                                                             // by the version set in devDependnecies in package.json
                       }));

        tsResult.dts.pipe(gulp.dest(config.dist.pathScripts));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.dist.pathScripts));
});

gulp.task('process-html', function() {
    gulp.src(config.src.html)
        .pipe(gulp.dest(config.dist.path));
});

gulp.task('process-css', function() {
    gulp.src(config.src.css)
        .pipe(gulp.dest(config.dist.pathCss));
});

gulp.task('watch', function() {
    gulp.watch([config.src.ts], ['compile-ts']);
    gulp.watch([config.src.html], ['process-html']);
    gulp.watch([config.src.css], ['process-css']);
});

/*
 * Limpa o diretório de scripts gerados e de dependências do Bower.
 */
gulp.task('clean', function() {
    var del = require('del');
    var mkdirp = require('mkdirp');
    del([
        config.dist.path
    ]);
    mkdirp(config.dist.path, {mode: '0755'}, function(err, made) {
        // err é uma possível condição de erro
        // made é o caminho do último diretório criado com sucesso
        if (err) console.error(err)
        else console.log('Scripts dir created: ' + made);
    });
});

gulp.task('static-assets', ['angular2', 'bower-dependencies']);

gulp.task('default', ['static-assets', 'process-html', 'process-css', 'compile-ts', 'watch', 'livereload']);
