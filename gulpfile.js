"use strict"; //eslint-disable-line
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
var jsdoc = require("gulp-jsdoc3");

gulp.task("doc", function (cb) {
  var config = require("./jsdoc.json");
  gulp.src(["README.md", "./src/**/*.js"], { read: false })
    .pipe(jsdoc(config, cb));
});

gulp.task("clean", () => {
  return del(["build/**/*"]);
});

gulp.task("compile:publish", ["lint"], () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "8.9.4", //8.9.4 LTS as of 17/01/2018
          },
          "useBuiltIns": "usage",
        },
      ]],
      "plugins": [
        "autobind-class-methods",
        "transform-class-properties",
      ],
    }))
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: "../src/"}))
    .pipe(gulp.dest("build/"));
});

gulp.task("compile", ["lint"], () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "current", //8.9.4 LTS as of 17/01/2018
          },
          "useBuiltIns": "usage",
        },
      ]],
      "plugins": [
        "autobind-class-methods",
        "transform-class-properties",
      ],
    }))
    .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: "../src/" }))
    .pipe(gulp.dest("build/"));
});


gulp.task("lint", ["clean"], () => {
  return gulp.src(["src/**/*.js"])
    .pipe(eslint({
      fix: true,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task("watch", () => {
  gulp.watch(["src/**/*.*"], ["default"]);
});

gulp.task("default", ["compile"]);
