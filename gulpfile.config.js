'use strict';
var GulpConfig = (function () {

    function GulpConfig() {

        var src =  './src/';
        var dist = './dist/';

        this.src = {
            path: src,
            ts: src + 'scripts/**/*.ts',
            css: src + 'styles/**/*.css',
            html: src + '**/*.html'
        };
        this.dist = {
            path: dist,
            allFiles: dist + '**/*',
            pathScripts: dist + 'scripts/',
            pathCss: dist + 'styles/',
            pathLibs: dist + 'libs/'
        };

        this.typings = './tools/typings/';
        this.dtsLibs =  this.typings + 'lib/**/*.ts';
        this.dtsApp = this.typings + 'App.d.ts';

        this.bowerComponents = './bower_components/';
        this.nodeModules = './node_modules/';
    }
    return GulpConfig;
})();
module.exports = GulpConfig;
