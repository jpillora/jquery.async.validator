/*global module:false*/
module.exports = function(grunt) {


  // Project configuration.
  grunt.initConfig({

    pkg: '<json:component.json>',
    meta: {
      banner:   
        '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
        ' MIT Licensed  */',
      header:
        '(function() {',
      footer:
        '}());'
    },
    concat: {
      dist: {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.header>',
          '<file_strip_banner:src/helper/jquery.console.js>',
          '<file_strip_banner:src/helper/guid.js>',
          '<file_strip_banner:src/helper/param-parser.js>',
          '<file_strip_banner:src/helper/resig-class.js>',
          '<file_strip_banner:src/helper/set.js>',
          '<file_strip_banner:src/helper/typedset.js>',
          '<file_strip_banner:src/<%= pkg.name %>.js>',
          '<file_strip_banner:src/<%= pkg.name %>.rules.js>',
          '<banner:meta.footer>'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    lint: {
      files: ['grunt.js', 'src/*.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    jshint: {
      options: {
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true,
        ParamParser: true,
        guid: true,
        TypedSet: true,
        Set: true,
        Class: true,
        console: true
      }
    },
    mocha: {
      all: [ 'test/**/*.html' ]
    }
  });
  
  grunt.loadNpmTasks('grunt-mocha');

  // Default task.
  grunt.registerTask('default', 'lint concat min mocha');

};
