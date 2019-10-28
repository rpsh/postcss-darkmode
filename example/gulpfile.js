const gulp = require("gulp");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const darkmode = require("../index");
const del = require("del");

gulp.task("clean", () => {
	return del(["./dist/css"]);
});

gulp.task("sass", function() {
	return gulp
		.src("./src/sass/*.scss")
		.pipe(
			sass
				.sync({
					outputStyle: "expanded",
					precision: 2,
				})
				.on("error", sass.logError)
		)
		.pipe(
			postcss([
				darkmode({
					ratio: 10, // 亮度调整的百分比，默认为 10%
					assignColors: [
						["#D6AB56"], // 保持颜色不变
						["#ff6022", "#f25b20"], // #ff6022 替换为 #f25b20
						["#ff00a0", "#e60090"],
						["#ff3333", "#e62e2e"],
						["#a1a1a1", "rgba(233, 237, 243, 0.1)"],
						["rgba(244, 20, 20, 0.3)", "#E91E63"],
					],
				}),
			])
		)
		.pipe(gulp.dest("./dist/css"));
});

gulp.task("default", ["clean", "sass"]);
