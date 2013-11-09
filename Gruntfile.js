module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: '\n'
            },
            dist: {
                src: [
                    'src/intro.js',
                    'src/lib.js',
                    'src/model.js',
                    'src/template.js',
                    'src/controller.js',
                    'src/crud.js',
                    'src/outro.js'
                ],
                dest: '<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: '' +
                    '//  ######   ########   ##     ##  ########\n' +
                    '// ##    ##  ##     ##  ##     ##  ##     ##\n' +
                    '// ##        ##     ##  ##     ##  ##     ##\n' +
                    '// ##        ########   ##     ##  ##     ##\n' +
                    '// ##        ##   ##    ##     ##  ##     ##\n' +
                    '// ##    ##  ##    ##   ##     ##  ##     ##\n' +
                    '//  ######   ##     ##   #######   ########\n' +
                    '// (MIT License) Brian Detering 2013\n' +
                    '// https://github.com/DubFriend/CRUD\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false,
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['concat', 'uglify']);
};
