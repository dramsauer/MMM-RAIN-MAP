/* Magic Mirror
 * Module: MMM-RAIN-MAP
 */

Module.register("MMM-RAIN-MAP", {
	defaults: {
		animationSpeedMs: 600,
		chromePath: null, // Set to "/usr/bin/chromium-browser" on Raspbian
		chromeTimeout: 0,
		defaultZoomLevel: 5,
		displayClockSymbol: false,
		displayOnRainOnly: false,
		displayTime: true,
		extraDelayLastFrameMs: 2000,
		mapHeightPx: 320,
		mapWidthPx: 320,
		markers: [
			{ lat: 50, lng: 9.27, zoom: 8, color: "red", hidden: false },
			{ lat: 50, lng: 9.27, zoom: 4, color: "red", hidden: true },
		],
		markerChangeInterval: 0,
		rainIcons: ["09d", "09n", "10d", "10n", "11d", "11n", "13d", "13n"],
		overlayOpacity: 0.65,
		timeFormat: config.timeFormat || 24,
		updateIntervalMs: 120000,
	},
	animationPosition: 0,
	animationTimer: false,
	loopNumber: 1,
	markerPosition: 0,
	map: null,
	radarLayers: [],
	timestamps: [],
	isCurrentlyRaining: false,

	start: function () {
		this.scheduleUpdate(this.updateIntervalMs);
		this.requestPrerenderedImage();
	},

	getDom: function () {
		let app = document.createElement("div");

		app.innerHTML = `<div>
			<span style='font-size: small;'id='weather-map-loading'><i class='fas fa-satellite'></i>&nbsp;Generating map... <span id='weather-map-loading-status'></span></span>
			<img style='display: none;' id='weather-map-prerendered' src=''>
			</div>`;
		return app;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "RAIN_MAP_PRERENDER_SUCCESS") {
			const path = "modules/MMM-RAIN-MAP/public/" + payload;
			document.getElementById("weather-map-prerendered").src = path;
			document.getElementById("weather-map-prerendered").style.display =
				"block";
			document.getElementById("weather-map-loading").style.display = "none";
		} else if (notification === "RAIN_MAP_PRERENDER_STATUS") {
			document.getElementById(
				"weather-map-loading-status"
			).innerHTML = `${payload.percentage}% - ${payload.state}`;
		}
	},

	notificationReceived: function (notification, payload, sender) {
		if (notification === "CURRENTWEATHER_DATA") {
			try {
				this.isCurrentlyRaining = this.config.rainIcons.includes(
					payload.data.weather[0].icon
				);
			} catch (err) {
				console.warn("Could not extract weather data");
			}
		}
	},

	requestPrerenderedImage: function () {
		this.sendSocketNotification("RAIN_MAP_PRERENDER", this.config);
	},

	scheduleUpdate: function () {
		const self = this;
		setInterval(function () {
			self.requestPrerenderedImage();
		}, self.config.updateIntervalMs);
	},
});
