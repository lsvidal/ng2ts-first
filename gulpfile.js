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
        root: config.distPath,
        port: 9000
    });
});

gulp.task('livereload', ['webserver'], function() {
    var files = [ config.distAllFiles ];
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

    return gulp.src(mainBowerFiles(), {base: config.bowerComponentsPath})
        .pipe(bowerNormalizer({bowerJson: './bower.json'}))
        .pipe(gulp.dest(config.distScriptsPath))
});

gulp.task('npm-dependencies', function() {
    console.log(config.distLibsPath);
    var depFiles = [
        config.nodeModulesPath + 'systemjs/dist/system.js*',
        config.nodeModulesPath + 'es6-module-loader/dist/es6-module-loader.js*',
        config.nodeModulesPath + 'es6-module-loader/dist/es6-module-loader-sans-promises.js*'
    ];
    console.log(depFiles);
    return gulp.src(depFiles)
            .pipe(gulp.dest(config.distLibsPath));
});

gulp.task('angular2', function() {

    //transpile & concat
    return gulp.src(
            [
                'node_modules/angular2/es6/prod/*.es6',
                'node_modules/angular2/es6/prod/src/**/*.es6'
            ],
            {base: 'node_modules/angular2/es6/prod'})
        .pipe(rename(function(path) {
            path.dirname = 'angular2/' + path.dirname; //this is not ideal... but not sure how to change angular's file structure
            path.extname = ''; //hack, see: https://github.com/sindresorhus/gulp-traceur/issues/54
        }))
        .pipe(traceur({modules: 'instantiate', moduleName: true}))
        .pipe(concat('angular2.js'))
        .pipe(gulp.dest(config.distLibsPath));
});

/**
 * Generates the app.d.ts references file dynamically from all application *.ts files.
 */
gulp.task('gen-ts-refs', function () {
    var sources = gulp.src([config.srcTs], {read: false});
    return gulp.src(config.appTypeScriptReferences)
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
    var sourceTsFiles = [config.srcTs,                       //path to typescript files
                         config.libraryTypeScriptDefinitions, //reference to library .d.ts files
                         config.appTypeScriptReferences];     //reference to app.d.ts files

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

        tsResult.dts.pipe(gulp.dest(config.distScriptsPath));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.distScriptsPath));
});

gulp.task('process-html', function() {
    gulp.src(config.srcHtml)
        .pipe(gulp.dest(config.distPath));
});

gulp.task('process-css', function() {
    gulp.src(config.srcCss)
        .pipe(gulp.dest(config.distCssPath));
});

gulp.task('watch', function() {
    gulp.watch([config.srcTs], ['compile-ts']);
    gulp.watch([config.srcHtml], ['process-html']);
    gulp.watch([config.srcCss], ['process-css']);
});

/*
 * Limpa o diretório de scripts gerados e de dependências do Bower.
 */
gulp.task('clean', function() {
    var del = require('del');
    var mkdirp = require('mkdirp');
    del([
        config.distPath
    ]);
    mkdirp(config.distPath, {mode: '0755'}, function(err, made) {
        // err é uma possível condição de erro
        // made é o caminho do último diretório criado com sucesso
        if (err) console.error(err)
        else console.log('Scripts dir created: ' + made);
    });
});

gulp.task('default', ['bower-dependencies', 'npm-dependencies', 'process-html', 'process-css', 'compile-ts', 'watch', 'livereload']);
