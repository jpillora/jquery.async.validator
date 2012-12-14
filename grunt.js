var fs = require('fs'),
    fetchUrl = require('fetch').fetchUrl;

/*global module:false*/
module.exports = function(grunt) {

  //write out a manifest of all the tests
  var tests = [];
  fs.readdirSync('test/tests/').forEach(function(t) {
    tests.push("tests/"+t);
  });
  fs.writeFileSync('test/specs.json', JSON.stringify(tests));

  //file lists
  var vanillaFiles = [
    '<file_strip_banner:src/vendor/jquery.console.js>',
    '<file_strip_banner:src/helper/guid.js>',
    '<file_strip_banner:src/helper/param-parser.js>',
    '<file_strip_banner:src/helper/resig-class.js>',
    '<file_strip_banner:src/helper/set.js>',
    '<file_strip_banner:src/helper/typedset.js>',
    '<file_strip_banner:src/<%= pkg.name %>.js>',
    '<file_strip_banner:src/<%= pkg.name %>.rules.js>'
  ];

  // Project configuration.
  grunt.initConfig({

    pkg: '<json:component.json>',
    meta: {
      pipeline:
        '//= require helper/json2\n'+
        '//= require helper/json2\n'+
        '//= require helper/resig-class\n'+
        '//= require helper/set\n'+
        '//= require helper/typedset\n'+
        '//= require helper/param-parser\n'+
        '//= require jquery.prompt\n'+
        '//= require jquery.console\n'+
        '//= require_self\n'+
        '//= require_directory ./<%= pkg.name %>\n',
      banner:
        '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
        ' MIT Licensed  */\n',
      header:
        '(function() {',
      footer:
        '}());'
    },
    webget: {
      prompt: {
        src: 'http://raw.github.com/jpillora/jquery.prompt/master/dist/jquery.prompt.js',
        dest: 'src/vendor/jquery.prompt.js'
      },
      console: {
        src: 'https://raw.github.com/jpillora/jquery.console/master/jquery.console.js',
        dest: 'src/vendor/jquery.console.js'
      }
    },
    concat: {
      vanilla: {
        src: ['<banner:meta.banner>',
              '<banner:meta.header>'].
              concat(vanillaFiles).
              concat(['<banner:meta.footer>']),
        dest: 'dist/<%= pkg.name %>.js'
      },
      includePrompt: {
        src: ['<banner:meta.banner>',
              '<banner:meta.header>',
               '<file_strip_banner:src/vendor/jquery.prompt.js>'
              ].concat(vanillaFiles).
              concat(['<banner:meta.footer>']),
        dest: 'dist/<%= pkg.name %>.prompt.js'
      },
      pipeline: {
        src: ['<banner:meta.pipeline>',
              '<banner:meta.banner>',
              '<file_strip_banner:src/<%= pkg.name %>.js>'],
        dest: 'dist/pipeline/<%= pkg.name %>.js'
      }
    },
    min: {
      vanilla: {
        src: ['<banner:meta.banner>', '<config:concat.vanilla.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      includePrompt: {
        src: ['<banner:meta.banner>', '<config:concat.includePrompt.dest>'],
        dest: 'dist/<%= pkg.name %>.prompt.min.js'
      }
    },
    lint: {
      files: ['grunt.js', 'src/*.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
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
        require: true,
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
    },
    copy: {
      dist: {
        files: {
          "src": "/Users/jpillora/tmp/"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mocha');

  // Fetcher task
  grunt.registerMultiTask('webget', 'Web get stuff.', function() {
    var done = this.async(),
        name = this.target,
        src = this.data.src,
        dest = this.data.dest;

    grunt.log.writeln("Web Getting: '" + name + "'");
    fetchUrl(src, function(error, meta, body) {
      if(error) {
        grunt.log.writeln("Error: '" + error + "'");
        done(false);
        return;
      }
      grunt.log.writeln("Saved: '" + src + "' as '" + dest + "'");
      fs.writeFileSync(dest, body);
      done(true);
    });
  });

  // Default task.
  grunt.registerTask('default', 'lint webget concat min mocha');
  grunt.renameTask('watch', 'real-watch');
  grunt.registerTask('watch', 'default real-watch');
  grunt.registerTask('rails', 'default copy');

};
