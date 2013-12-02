module.exports = function (grunt) {
    var bannerTemplate = '' +
        '// <%= pkg.name %> version <%= pkg.version %>\n' +
        '// (<%= pkg.license %>) <%= grunt.template.today("dd-mm-yyyy") %>\n' +
        '// <%= pkg.website %>\n';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: '\n',
                banner: bannerTemplate
            },
            dist: {
                src: [
                    'src/intro.js',
                    'src/lib.js',

                    'src/model/base.js',
                    'src/model/schema.js',
                    'src/model/request.js',
                    'src/model/filter.js',
                    'src/model/order.js',
                    'src/model/paginator.js',
                    'src/model/forminator.js',

                    'src/view/base.js',
                    'src/view/delete.js',
                    'src/view/filter.js',
                    'src/view/form.js',
                    'src/view/form_list.js',
                    'src/view/list.js',
                    'src/view/list_item.js',
                    'src/view/paginator.js',
                    'src/view/forminator.js',

                    'src/controller/base.js',
                    'src/controller/filter.js',
                    'src/controller/form.js',
                    'src/controller/form_list.js',
                    'src/controller/list.js',
                    'src/controller/list_item.js',
                    'src/controller/paginator.js',
                    'src/controller/forminator.js',

                    'src/crud.js',
                    'src/outro.js'
                ],
                dest: '<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: bannerTemplate
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
