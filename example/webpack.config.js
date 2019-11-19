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
									excludeFiles: ["style.scss"], // 不需要暗色转化的文件，支持正则匹配
								}),
							],
						},
					},
				],
			},
		],
	},
};
