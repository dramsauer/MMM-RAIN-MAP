const NodeHelper = require("node_helper");
const puppeteer = require("puppeteer");
const NodeUtils = require("./NodeUtils");
module.exports = NodeHelper.create({
	browser: null,
	currentRenderPosition: 0,
	shotsDir: "",
	pubDir: "",
	start: function () {
		console.log(`${this.name} helper method started...`);
	},
	socketNotificationReceived: function (notification, payload) {
		if (notification === "RAIN_MAP_PRERENDER") {
			this.setupBrowser(payload);
		}
	},
	returnStatus: function (percentage, state) {
		console.log(state);
		this.sendSocketNotification("RAIN_MAP_PRERENDER_STATUS", {
			percentage,
			state,
		});
	},

	handleNodeHelperMessage: async function (msg, page, config) {
		console.log("Notification received:", msg);
		switch (msg.notification) {
			case "MAP_INIT_SUCCESS":
				await page.evaluate(() => {
					getTimestamps();
				});
				break;
			case "GET_TIMESTAMPS_SUCCESS":
				this.timestamps = msg.data;
				this.currentRenderPosition = 0;
				await page.evaluate(() => {
					renderNextFrame();
				});
				break;
			case "RENDER_FRAME_SUCCESS":
				await page
					.screenshot({
						path: `${this.shotsDir}shot-${msg.data.markerPosition}_${msg.data.ts}.png`,
					})
					.catch((err) => {});
				if (msg.data.hasMore) {
					await page.evaluate(() => {
						renderNextFrame();
					});
				} else {
					if (this.browser) {
						this.browser.close().catch();
					}
					const ts = await NodeUtils.renderImagesToGif(
						config,
						this.shotsDir,
						this.pubDir
					);
					this.sendSocketNotification(
						"RAIN_MAP_PRERENDER_SUCCESS",
						`preRenderedMap${ts}.gif`
					);
				}
				break;
		}
	},
	setupBrowser: async function (remoteConfig) {
		try {
			const self = this;
			this.shotsDir = `${self.path}/shots/`;
			this.pubDir = `${self.path}/public/`;

			self.returnStatus(0, "Started");
			NodeUtils.clearDirectory(this.shotsDir, /[.]png$/);
			NodeUtils.clearDirectory(this.pubDir, /[.]gif$/);

			this.browser = await puppeteer.launch({
				executablePath: remoteConfig.chromePath,
				headless: true,
				devtools: false,
			});
			self.returnStatus(20, "Browser launched");
			const page = await this.browser.newPage();
			page.setDefaultNavigationTimeout(remoteConfig.chromeTimeout);
			await page.goto(
				`http://localhost:8080/modules/${this.name}/public/map.html`,
				{
					waitUntil: "networkidle0",
				}
			);
			self.returnStatus(20, "Map opened");
			await page.setViewport({
				width: remoteConfig.mapWidthPx,
				height: remoteConfig.mapHeightPx,
			});
			self.returnStatus(25, "Viewport adjusted");

			await page.exposeFunction("postNodeHelperMessage", (msg) => {
				self.handleNodeHelperMessage(msg, page, remoteConfig);
			});
			self.returnStatus(30, "Setup complete. Ready to capture!");

			await page.evaluate((data) => {
				config = data;
				initMap();
			}, remoteConfig);
			self.returnStatus(35, "Capturing started...");
		} catch (err) {
			console.log(err);
			if (this.browser) {
				this.browser.close().catch();
			}
		}
	},
});
