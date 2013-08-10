'use strict';

var request = require('request');

module.exports = function (grunt) {
  var reloadPort = 35729, files;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      server: {
        files: [
          'app.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      },
      js: {
        files: ['public/javascripts/*.js'],
        options: { livereload: reloadPort},
      },
      coffee: {
        files: ['assets/javascripts/*.coffee'],
        options: { livereload: reloadPort},
        tasks: ['coffee']
      },
      css: {
        files: ['assets/stylesheets/*.css'],
        options: { livereload: reloadPort},
      },
      sass: {
        files: ['assets/stylesheets/*.sass'],
        options: { livereload: reloadPort},
        tasks: ['sass']
      },
      jade: {
        files: ['views/*.jade'],
        options: { livereload: reloadPort},
      }
    },
    sass: {                              // Task
      dist: {                            // Target
        options: {                       // Target options
          style: 'expanded'
        },
        files: {                         // Dictionary of files
          'public/stylesheets/styles.css': 'assets/stylesheets/styles.sass',       // 'destination': 'source'
        }
      }
    },
    coffee: {
      compile: {
        files: {
          'public/javascripts/kit.js': 'assets/javascripts/kit.coffee',
          'public/javascripts/client.js': 'assets/javascripts/client.coffee' // 1:1 compile
        }
      }
    }
  });

  grunt.config.requires('watch.server.files');
  files = grunt.config('watch.server.files');
  files = grunt.file.expand(files);

  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
    var done = this.async();
    setTimeout(function () {
      request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','),  function(err, res) {
          var reloaded = !err && res.statusCode === 200;
          if (reloaded)
            grunt.log.ok('Delayed live reload successful.');
          else
            grunt.log.error('Unable to make a delayed live reload.');
          done(reloaded);
        });
    }, 500);
  });

  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.registerTask('default', ['develop', 'watch', 'sass']);
};
