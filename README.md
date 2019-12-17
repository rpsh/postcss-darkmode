# PostCSS Darkmode

Generate darkmode style from css file.

分析 CSS 文件中的颜色，生成「深色模式」的样式。

## Installation 安装

```bash
$ npm install postcss-darkmode --save-dev
```

## Options 配置

-   `ratio` (number) ：亮度调整的百分比，默认为 10
-   `assignColors` (array)： 颜色替换表，如
    ```
    assignColors: [
        	["#D6AB56"], // 保持颜色不变
        	["#ff6022", "#f25b20"], // #ff6022 替换为 #f25b20
        ]
    ```
-   `skipExistingDarkMediaQuery` (boolean)： 不处理 css 文件中已有的 darmkmode Media Query 中的颜色规则， 默认为 true
-   `excludeFiles`(array): 不需要深色转化的文件，支持正则匹配， 如 `excludeFiles: ["aaa.css", /bbb\.css/],`

## Control Comments 注释控制

-   `/* darkmode: off */` Disable all Darkmode translations for the whole block both before and after the comment. 这个注释所在的 css 规则块都不进行「深色模式」转化
-   `/* darkmode: ignore next */` Disable Darkmode translations only for the next property. 只忽略紧跟这个注释后的一条
-   `/* darkmode: {#f00} */` Replace the next property with `#f00`. 使用 `#f00` 替换紧跟这个注释后的规则的值

## Usage 使用

### Use webpack

```js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	mode: "development",
	entry: "./src/index.js",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "css/style.min.css",
			chunkFilename: "css/[id].min.css",
			ignoreOrder: false,
		}),
	],
	module: {
		rules: [
			{
				test: /\.s[ac]ss$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: process.env.NODE_ENV !== "production",
						},
					},
					"css-loader",
					"sass-loader",
					{
						loader: "postcss-loader",
						options: {
							ident: "postcss",
							plugins: [
								require("postcss-darkmode")({
									ratio: 10, // 亮度调整的百分比，默认为 10%
									assignColors: [
										["#D6AB56"], // 保持颜色不变
										["#ff6022", "#f25b20"], // #ff6022 替换为 #f25b20
										["#ff00a0", "#e60090"],
										["#ff3333", "#e62e2e"],
										["#a1a1a1", "rgba(233, 237, 243, 0.1)"],
										["rgba(244, 20, 20, 0.3)", "#E91E63"],
									],
									skipExistingDarkMediaQuery: true,
									excludeFiles: ["style.scss"], // 不需要深色转化的文件，支持正则匹配
									splitFiles: {
										enable: false, // 是否将深色样式分离为一个新的css文件
										suffix: ".darkmode", //深色css文件名后缀，比如 filename.css 的分离出深色文件： filename.darkmode.css
										destDir: "../../dist/css", //文件输出目录（相对当前要处理的css文件所在目录）
									},
									inject: {
										enable: false, // 是否不使用媒体查询模式，而通过类名切换深色样式
										injectSelector: ".__darkmode__", // 切换深色样式的类名
										baseSelector: "html", // 这个类名要添加在哪个选择器上
									},
								}),
							],
						},
					},
				],
			},
		],
	},
};
```

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
					ratio: 10, // 亮度调整的百分比，默认为 10%， 如果为0，再不自动调整颜色亮度
					assignColors: [
						// 颜色替换表，不在此表的颜色将按照 ratio 进行亮度调整
						["#D6AB56"], // 保持颜色不变
						["#ff6022", "#f25b20"], // #ff6022 替换为 #f25b20
						["#ff00a0", "#e60090"],
						["#ff3333", "#e62e2e"],
						["#a1a1a1", "rgba(233, 237, 243, 0.1)"],
						["rgba(244, 20, 20, 0.3)", "#E91E63"],
					],
					skipExistingDarkMediaQuery: true, //不处理 css 文件中已有的 darmkmode Media Query 中的颜色规则， 默认为 true
					excludeFiles: ["style.scss"], // 不需要深色转化的文件，支持正则匹配
					splitFiles: {
						enable: false, // 是否将深色样式分离为一个新的css文件
						suffix: ".darkmode", //深色css文件名后缀，比如 filename.css 的分离出深色文件： filename.darkmode.css
						destDir: "../../dist/css", //文件输出目录（相对当前要处理的css文件所在目录）
					},
					inject: {
						enable: false, // 是否不使用媒体查询模式，而通过类名切换深色样式
						injectSelector: ".__darkmode__", // 切换深色样式的类名
						baseSelector: "html", // 这个类名要添加在哪个选择器上
					},
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
