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
    console.log(config.srcHtml);
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

gulp.task('default', ['bower-dependencies', 'process-html', 'process-css', 'compile-ts', 'watch', 'livereload']);
