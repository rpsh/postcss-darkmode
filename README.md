# PostCSS Darkmode

Generate darkmode style from css file.

分析 CSS 文件中的颜色，生成「深色模式」的样式。

## Installation

```bash
$ npm install postcss-darkmode --save-dev
```

## Usage

### Use gulp

```js
const gulp = require("gulp");
const postcss = require("gulp-postcss");
const darkmode = require("postcss-darkmode");
gulp.task("css", () => {
	return gulp
		.src("*.css")
		.pipe(
			postcss([
				darkmode({
					ratio: 10, // 亮度调整的百分比，默认为 10%
					assignColors: [
						// 颜色替换表，不在此表的颜色将按照 ratio 进行亮度调整
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
```

Before:

```css
.box {
	width: 100%;
	/* darkmode: ignore next */
	color: #a1a1a1;
	/* darkmode: {#f0f} */
	caret-color: rgba(244, 20, 20, 0.3);
	border: 1px solid #ffb821;
	background: #fff url(icon.png);
	column-rule: thick inset #0000ff;
}
.box2 {
	/* darkmode: off */
	background: #333;
	color: #f6f8fa;
}
.box3 {
	color: pink;
	border: 1px solid green;
	background: #fff;
	/* darkmode: { linear-gradient(90deg, rgba(18, 18, 18, 0.2), #121212 40px) } */
	background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), #fff 40px);
}
```

After:

```css
.box {
	width: 100%;
	/* darkmode: ignore next */
	color: #a1a1a1;
	/* darkmode: {#f0f} */
	caret-color: rgba(244, 20, 20, 0.3);
	border: 1px solid #ffb821;
	background: #fff url(icon.png);
	column-rule: thick inset #0000ff;
}
.box2 {
	/* darkmode: off */
	background: #333;
	color: #f6f8fa;
}
.box3 {
	color: pink;
	border: 1px solid green;
	background: #fff;
	/* darkmode: { linear-gradient(90deg, rgba(18, 18, 18, 0.2), #121212 40px) } */
	background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), #fff 40px);
}
@media (prefers-color-scheme: dark) {
	.box {
		caret-color: #f0f;
		border-color: #ffaf04;
		background-color: #121212;
		column-rule-color: #1a1aff;
	}
	.box3 {
		color: #ff93a6;
		border-color: #008d00;
		background: #121212;
		background: linear-gradient(90deg, rgba(18, 18, 18, 0.2), #121212 40px);
	}
}
```
