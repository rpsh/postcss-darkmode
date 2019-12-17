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
			filename: "css/index.min.css",
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
									excludeFiles: ["style.scss"], // 不需要暗色转化的文件，支持正则匹配
									splitFiles: {
										enable: true,
										suffix: ".darkmode", //深色css文件名后缀，比如 filename.css 的分离出深色文件： filename.darkmode.css
										destDir: "../../dist/css", //文件输出目录（相对当前要处理的css文件所在目录）
									},
									inject: {
										enable: true,
										injectSelector: ".__darkmode__", // 不使用媒体查询模式，而通过类名切换深色样式
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
