
module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    version: grunt.file.readJSON('package.json').version,
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */\n',

    less: {
      production: {
        files: { 'css/bundle.css': 'static/less/main.less' },
        options: { compress: true },
        plugins: [
          // new (require('less-plugin-autoprefix'))({browsers: ["last 2 versions"]}),
          // new (require('less-plugin-clean-css'))({})
        ],
      },
    },
    watch: {
      options: {
        atBegin: true,
      },
      less: {
        files: ['static/**/*.less'],
        tasks: ['less'],
        options: { spawn: true },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
};