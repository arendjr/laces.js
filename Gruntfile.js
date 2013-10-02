module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            main: [
                "Gruntfile.js",
                "laces.js",
                "laces.local.js",
                "laces.tie.js"
            ],
            test: {
                options: {
                    predef: ["describe", "it"]
                },
                src: [ "test/spec/*.js" ]
            }
        },

        uglify: {
            laces: {
                src: "laces.js",
                dest: "minified/laces.min.js"
            },
            lacesLocal: {
                src: "laces.local.js",
                dest: "minified/laces.local.min.js"
            },
            lacesTie: {
                src: "laces.tie.js",
                dest: "minified/laces.tie.min.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["jshint", "uglify"]);
};
