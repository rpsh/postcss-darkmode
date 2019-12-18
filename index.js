const postcss = require("postcss");
const path = require("path");
const fs = require("fs");
const Color = require("color");
const cssnano = require("cssnano");

const DARKMODE_IGNORE_NEXT = /(!\s*)?darkmode:\s*ignore\s+next/i;
const DARKMODE_COMMENTS = /(!\s*)?darkmode:\s*(off|on)/i;
const DARKMODE_ASSIGN = /(!\s*)?darkmode:\s*{([^}])*}/i;
const DARKMODE_COMMENTS_ALL_OFF = /(!\s*)?darkmode:\s*all\s*off/i;

const colorKeyWords = require("./colorKeywords");

const colorDict = colorKeyWords.concat([
	"(#[0-9A-F]{6})",
	"(#[0-9A-F]{3})",
	"(rgb|hsl)a?([^)]*)",
]);

const colorReg = new RegExp(colorDict.join("|"), "i");

function parseColor(value) {
	try {
		return Color(value);
	} catch (e) {
		return null;
	}
}

function parseDeclColor(decl) {
	let inputColor = parseColor(decl.value);

	// 一些包含颜色的属性
	if (decl && !inputColor) {
		if (
			decl.prop.includes("border") ||
			decl.prop.includes("outline") ||
			decl.prop.includes("column-rule") ||
			decl.prop.includes("text-emphasis") ||
			decl.prop.includes("text-decoration") ||
			decl.prop === "box-shadow" ||
			decl.prop === "background"
		) {
			let result = decl.value.match(colorReg);
			if (result && result[0]) {
				inputColor = parseColor(result[0]);
			}
		}
	}

	return inputColor;
}

function modifyColor(decl, dictColors, assignColor, ratio) {
	// 注释指定替换颜色
	if (decl._assignValue) {
		return decl._assignValue;
	}

	let inputColor = parseDeclColor(decl);
	let color = inputColor && inputColor.rgb().string();
	let index = dictColors.indexOf(color);
	let output;

	// 手动设定的颜色对照表
	if (~index) {
		return assignColor[index][1] || color;
	}

	// ratio为0 ，不自动调整颜色
	if (ratio === 0) {
		return null;
	}

	//纯白颜色处理
	if (inputColor.hex() == "#FFFFFF" && ~decl.prop.indexOf("background")) {
		//  google 推荐的暗色颜色色值
		// https://material.io/design/color/dark-theme.html
		output = parseColor("rgba(18, 18, 18, " + inputColor.valpha + ")");
		return decl.value.includes("rgb") ? output.rgb() : output.hex();
	}

	let hslColor = inputColor.hsl();

	if (hslColor.color) {
		let light = hslColor.color[2];
		let h = hslColor.color[0],
			s = hslColor.color[1];

		if (!hslColor.color[0] && !hslColor.color[1]) {
			// 背景颜色是白色/黑色，则处理为反色
			h = 0;
			s = 0;
		}

		light = 100 - light * (1 - ratio);
		light = light <= 10 ? light + 10 : light >= 90 ? light - 10 : light;
		output = parseColor(`hsla(${h}, ${s}%, ${light}%, ${hslColor.valpha})`);
	}

	// 根据设定参数降低颜色透明度
	switch (inputColor.model) {
		case "rgb":
			return decl.value.includes("rgb")
				? output.rgb().string()
				: output.hex();
			break;
		case "hsl":
			return output.hsl().string();
			break;
		default:
			return;
	}
}

module.exports = postcss.plugin("postcss-darkmode", function(opts) {
	opts = opts || {};

	let skipExistingDarkMediaQuery =
		opts.skipExistingDarkMediaQuery === undefined
			? true
			: opts.skipExistingDarkMediaQuery;

	let excludeFiles = opts.excludeFiles || [];
	let inject = (opts.inject && opts.inject.enable) || undefined,
		injectSelector =
			(opts.inject && opts.inject.injectSelector) || undefined,
		baseSelector = (opts.inject && opts.inject.baseSelector) || undefined;

	let split = opts.splitFiles && opts.splitFiles.enable,
		splitSuffix =
			(opts.splitFiles && opts.splitFiles.suffix) || ".darkmode",
		splitDestDir = (opts.splitFiles && opts.splitFiles.destDir) || "";

	let dictColors = [];
	opts.assignColors.forEach(item => {
		dictColors.push(
			parseColor(item[0])
				.rgb()
				.string()
		);
	});

	return async function(style) {
		function checkDisabled(node, result) {
			if (!node) return false;

			if (node._darkmodeDisabled !== undefined) {
				return node._darkmodeDisabled;
			}

			if (node.parent) {
				let p = node.prev();

				// 注释声明忽略下一行
				if (
					p &&
					p.type === "comment" &&
					DARKMODE_IGNORE_NEXT.test(p.text)
				) {
					node._darkmodeDisabled = true;
					node._darkmodeSelfDisabled = true;
					return true;
				}

				// 注释声明指定替换颜色
				if (p && p.type === "comment" && DARKMODE_ASSIGN.test(p.text)) {
					let m = p.text.match(/\{([^\}]*)\}/i);
					if (m && m[1]) {
						node._assignValue = m[1];
					}
				}
			}

			let value = null;
			if (node.nodes) {
				let status;
				node.each(i => {
					if (i.type !== "comment") return;
					if (DARKMODE_COMMENTS.test(i.text)) {
						if (typeof status === "undefined") {
							status = /on/i.test(i.text);
						}
					}
				});

				if (status !== undefined) {
					value = !status;
				}
			}
			if (!node.nodes || value === null) {
				if (node.parent) {
					let isParentDisabled = checkDisabled(node.parent);
					if (node.parent._darkmodeSelfDisabled === true) {
						value = false;
					} else {
						value = isParentDisabled;
					}
				} else {
					value = false;
				}
			}
			node._darkmodeDisabled = value;
			return value;
		}

		let skipFile = excludeFiles.some(item => {
			return style.source.input.file.match(item);
		});

		style.walkComments(comment => {
			if (comment && DARKMODE_COMMENTS_ALL_OFF.test(comment.text)) {
				skipFile = true;
			}
		});

		if (skipFile) {
			return;
		}

		let rules = [];
		style.walkDecls(function(decl) {
			// CSS 中既有的 darkmode media query 不处理
			if (
				skipExistingDarkMediaQuery &&
				decl.parent &&
				decl.parent.parent &&
				decl.parent.parent.name === "media" &&
				decl.parent.parent.params === "(prefers-color-scheme: dark)"
			) {
				return undefined;
			}

			// 注释声明不需要处理
			if (checkDisabled(decl)) return undefined;

			// 不做处理
			if (
				!decl.value ||
				decl.value === "transparent" ||
				decl.prop.includes("text-fill-color")
			) {
				return;
			}

			let inputColor = parseDeclColor(decl);

			if (!inputColor && !decl._assignValue) {
				return;
			}

			rules.push(decl);
		});
		if (!rules.length) {
			return;
		}

		let media = postcss.parse("@media (prefers-color-scheme: dark) {}");
		let node = media.first;

		if (inject || split) {
			media = postcss.root();
			node = media;
		}

		let ratio = Number.isInteger(opts.ratio)
			? Number(opts.ratio) / 100
			: 0.1;
		if (ratio > 1) {
			ratio = 1;
		}
		if (ratio < 0) {
			ratio = 0;
		}

		rules.forEach((decl, index) => {
			let outputColor = modifyColor(
				decl,
				dictColors,
				opts.assignColors,
				ratio
			);

			if (!outputColor) {
				return false;
			}

			// 选择器处理
			let selector = decl.parent.selector;
			if (inject && injectSelector) {
				if (decl.parent.selector === baseSelector) {
					selector = selector + injectSelector;
				} else {
					selector = injectSelector + " " + selector;
				}
			}

			// 一些包含颜色的属性
			if (decl && !decl._assignValue && !parseColor(decl.value)) {
				if (
					decl.prop.includes("border") ||
					decl.prop.includes("outline") ||
					decl.prop.includes("column-rule") ||
					decl.prop.includes("text-emphasis") ||
					decl.prop.includes("text-decoration")
				) {
					if (outputColor) {
						node.append(
							`${selector}{${decl.prop}-color:${outputColor}}`
						);
					}
				} else if (
					decl.prop === "background" &&
					!~decl.prop.indexOf("gradient")
				) {
					node.append(
						`${selector}{${decl.prop}-color:${outputColor}}`
					);
				} else if (decl.prop === "box-shadow") {
					let result = decl.value.match(colorReg);
					if (result && result[0]) {
						let _value = decl.value.replace(result[0], outputColor);
						node.append(`${selector}{${decl.prop}:${_value}}`);
					}
				}
			} else {
				node.append(`${selector}{${decl.prop}:${outputColor}}`);
			}
		});
		// 合并相同的选择器
		let minify = await postcss([cssnano]).process(media, {
			from: undefined,
		});

		if (split && splitDestDir) {
			let splitFilePath = getSplitFilename(
				style.source.input.file,
				splitDestDir,
				splitSuffix
			);
			saveFile(splitFilePath, minify.css);
		} else {
			style.append(minify.css);
		}
	};
});

function getSplitFilename(filePath, dir, suffix) {
	let fileDir = path.dirname(filePath),
		fileName = path.basename(filePath);

	let destDir = path.join(fileDir, dir);

	var position = fileName.lastIndexOf("."),
		result = "";

	result = fileName.substring(0, position);
	result += suffix;
	result += ".css";

	return path.join(destDir, result);
}

function saveFile(filepath, css) {
	if (css) {
		fs.writeFileSync(filepath, css);
	}
}
