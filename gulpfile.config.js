'use strict';
var GulpConfig = (function () {
    function GulpConfig() {
        
        this.srcPath = './src/';
        this.srcTs = this.srcPath + 'scripts/**/*.ts';
        this.srcCss = this.srcPath + 'styles/**/*.css';
        this.srcHtml = this.srcPath + '**/*.html';

        this.distPath = './dist/';
        this.distAllFiles = this.distPath + '**/*';
        this.distScriptsPath = this.distPath + 'scripts';
        this.distCssPath = this.distPath + 'styles';

        this.typings = './tools/typings/';
        this.libraryTypeScriptDefinitions =  this.typings + 'lib/**/*.ts';
        this.appTypeScriptReferences = this.typings + 'typescriptApp.d.ts';

        this.bowerComponentsPath = './bower_components';
    }
    return GulpConfig;
})();
module.exports = GulpConfig;
