module.exports = function (grunt) {
  //init stuff
  grunt.initConfig({

    nsp: {
      package: grunt.file.readJSON('package.json')
    },

    //jsdoc config
    jsdoc: {
      dist: {
        src: [
          'README.md',
          'lib/**/*.js',
        ],
        options: {
          destination: 'docs',
          template: 'node_modules/ink-docstrap/template',
          // configure: "node_modules/ink-docstrap/template/jsdoc.conf.json"
          configure: 'jsdoc.json'
        }
      }
    },

    tslint: {
      options: {
        // can be a configuration object or a filepath to tslint.json
        configuration: "tslint.json",
        // If set to true, tslint errors will be reported, but not fail the task
        // If set to false, tslint errors will be reported, and the task will fail
        force: false,
        fix: false
      },
      files: {
        src: [
          "lib/**/*.ts"
        ]
      }
    },

    // // devserver config
    // devserver: {
    //   server: {},
    //   options: {
    //     'base': 'docs'
    //   }
    // },

    // jshint: {
    //   all: ['Gruntfile.js', 'lib/**/*.js'],
    //   options: {
    //     jshintrc: true
    //   }
    // }
  });

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-tslint");
  // grunt.loadNpmTasks('grunt-nsp');

  grunt.registerTask('doc', ['jsdoc']);
  grunt.registerTask('validate', ['tslint']);
  // grunt.registerTask('validate', ['tslint', 'nsp']);

  grunt.registerTask('default', ['validate']);
};
