const del = require("del");
const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");

const darkmode = require("../index");
// const darkmode = require("postcss-darkmode");

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
					ignoreExistingDarkMediaQuery: true,
					ignoreFiles: ["style.css"], // 不需要 darkmode 转化的文件，支持正则匹配
					splitFiles: {
						enable: true,
						suffix: ".darkmode", //深色css文件名后缀，比如 filename.css 的分离出深色文件： filename.darkmode.css
						destDir: "../../dist/css", //文件输出目录（相对当前要处理的css文件所在目录）
					},
					inject: {
						enable: true,
						injectSelector: ".__darkmode__", // 不使用媒体查询模式，而通过类名切换深色样式
						baseSelector: "html", // 这个类名要添加在哪个选择器上
						keepMediaQuery: true, // 保留 media query 部分的代码，满足某些两种代码都需要的需求
					},
				}),
			])
		)
		.pipe(gulp.dest("./dist/css"));
});

gulp.task("default", gulp.series(["sass"]));
