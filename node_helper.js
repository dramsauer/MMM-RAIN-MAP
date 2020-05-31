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
		self.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", "0% - Started");
		try {
			const browser = await puppeteer.launch({
				headless: true,
				devtools: false,
			});
			self.sendSocketNotification(
				"RAIN_MAP_PRERENDER_STATUS",
				"20% - Virtual Browser started"
			);
			const page = await browser.newPage();
			console.log("path", this.path);
			await page.goto(
				"http://localhost:8080/modules/MMM-RAIN-MAP/public/map.html",
				{
					waitUntil: "networkidle0",
				}
			);
			console.log("Config is:", remoteConfig);
			await page.setViewport({
				width: remoteConfig.mapWidthPx,
				height: remoteConfig.mapHeightPx,
			});

			await page.exposeFunction("takeScreenshot", async (data) => {
				console.log(data);
				page
					.screenshot({
						path: `${self.path}/shots/shot-${data.markerPosition}-${data.ts}.png`,
					})
					.catch((err) => {});
				if (
					data.markerPosition >= data.markers &&
					data.timestampPosition >= data.timestamps
				) {
					self.sendSocketNotification(
						"RAIN_MAP_PRERENDER_STATUS",
						"60 % - Capturing complete"
					);
					await browser.close();
					const encoder = new GIFEncoder(
						remoteConfig.mapWidthPx,
						remoteConfig.mapHeightPx
					);
					self.sendSocketNotification(
						"RAIN_MAP_PRERENDER_STATUS",
						"> 60% - Rendering gif..."
					);
					const stream = pngFileStream(`${self.path}/shots/shot*.png`)
						.pipe(
							encoder.createWriteStream({
								repeat: 0,
								delay: remoteConfig.animationSpeedMs,
								quality: 10,
							})
						)
						.pipe(
							fs.createWriteStream(`${self.path}/public/preRenderedMap.gif`)
						);

					stream.on("finish", function () {
						console.log("Rendering done.");
						self.sendSocketNotification(
							"RAIN_MAP_PRERENDER_SUCCESS",
							"preRenderedMap.gif"
						);
					});
				}
			});
			self.sendSocketNotification(
				"RAIN_MAP_PRERENDER_STATUS",
				"25% - Browser setup complete"
			);

			await page.evaluate((data) => {
				config = data;
				renderMap();
			}, remoteConfig);
			self.sendSocketNotification(
				"RAIN_MAP_PRERENDER_STATUS",
				"30% - Capturing started"
			);
		} catch (err) {
			console.log(err);
		} finally {
			console.log("bla");
		}
	},
});
