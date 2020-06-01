const GIFEncoder = require("gifencoder");
const pngFileStream = require("png-file-stream");
const fs = require("fs");
module.exports.clearDirectory = async (dir, regex) => {
	await fs
		.readdirSync(dir)
		.filter((f) => regex.test(f))
		.map((f) => fs.unlinkSync(dir + f));
};

module.exports.renderImagesToGif = async function (config, shotsDir, pubDir) {
	const currentTimestamp = Date.now();
	const encoder = new GIFEncoder(config.mapWidthPx, config.mapHeightPx);
	const stream = pngFileStream(`${shotsDir}shot*.png`)
		.pipe(
			encoder.createWriteStream({
				repeat: 0,
				delay: config.animationSpeedMs,
				quality: 10,
			})
		)
		.pipe(
			fs.createWriteStream(`${pubDir}preRenderedMap${currentTimestamp}.gif`)
		);
	await new Promise((resolve, reject) => {
		stream.on("finish", resolve);
		stream.on("error", reject);
	});
	return currentTimestamp;
};
