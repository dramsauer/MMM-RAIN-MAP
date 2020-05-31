const NodeHelper = require("node_helper");
const puppeteer = require("puppeteer");
const GIFEncoder = require("gifencoder");
const pngFileStream = require("png-file-stream");
const fs = require("fs");
module.exports = NodeHelper.create({
	start: function () {
		console.log(`${this.name} helper method started...`);
	},
	socketNotificationReceived: function (notification, payload) {
		if (notification === "RAIN_MAP_PRERENDER") {
			this.renderMap(payload);
		}
	},
	renderMap: async function (remoteConfig) {
		const self = this;
		const shotsDir = `${self.path}/shots/`;
		const pubDir = `${self.path}/public/`;
		let status = {
			percentage: 0,
			state: "Started",
		};
		self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
		try {
			let regex = /[.]gif$/;
			fs.readdirSync(pubDir)
				.filter((f) => regex.test(f))
				.map((f) => fs.unlinkSync(pubDir + f));
			regex = /[.]gif$/;
			fs.readdirSync(shotsDir)
				.filter((f) => regex.test(f))
				.map((f) => fs.unlinkSync(shotsDir + f));
			const browser = await puppeteer.launch({
				executablePath: remoteConfig.chromePath,
				headless: true,
				devtools: false,
			});
			status = {
				percentage: 10,
				state: "Browser launched",
			};
			self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
			const page = await browser.newPage();
			await page.setDefaultNavigationTimeout(remoteConfig.chromeTimeout);
			await page.goto(
				"http://localhost:8080/modules/MMM-RAIN-MAP/public/map.html",
				{
					waitUntil: "networkidle0",
				}
			);
			status = {
				percentage: 20,
				state: "Map opened",
			};
			self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
			await page.setViewport({
				width: remoteConfig.mapWidthPx,
				height: remoteConfig.mapHeightPx,
			});
			status = {
				percentage: 25,
				state: "Viewport adjusted",
			};
			self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);

			await page.exposeFunction("takeScreenshot", async (data) => {
				console.log(data);
				await page
					.screenshot({
						path: `${shotsDir}shot-${data.markerPosition}-${data.ts}.png`,
					})
					.catch((err) => {});
				if (
					(data.markerPosition >= data.markers &&
						data.timestampPosition >= data.timestamps) ||
					(remoteConfig.markerChangeInterval === 0 &&
						data.timestampPosition >= data.timestamps)
				) {
					console.log("Complete");
					status = {
						percentage: 75,
						state: "Capturing complete",
					};
					self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
					await browser.close();
					const encoder = new GIFEncoder(
						remoteConfig.mapWidthPx,
						remoteConfig.mapHeightPx
					);
					status = {
						percentage: 85,
						state: "Rendering gif animation...",
					};
					self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
					const currentTimestamp = Date.now();
					const stream = pngFileStream(`${shotsDir}shot*.png`)
						.pipe(
							encoder.createWriteStream({
								repeat: 0,
								delay: remoteConfig.animationSpeedMs,
								quality: 10,
							})
						)
						.pipe(
							fs.createWriteStream(
								`${self.path}/public/preRenderedMap${currentTimestamp}.gif`
							)
						);

					stream.on("finish", function () {
						console.log("Rendering done.");
						self.sendSocketNotification(
							"RAIN_MAP_PRERENDER_SUCCESS",
							`preRenderedMap${currentTimestamp}.gif`
						);
					});
				}
			});
			status = {
				percentage: 30,
				state: "Setup complete. Ready to capture!",
			};
			self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);

			await page.evaluate((data) => {
				config = data;
				renderMap();
			}, remoteConfig);
			status = {
				percentage: 35,
				state: "Capturing started...",
			};
			self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", status);
		} catch (err) {
			console.log(err);
		}
	},
});
