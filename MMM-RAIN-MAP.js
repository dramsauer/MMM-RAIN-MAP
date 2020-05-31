/* Magic Mirror
 * Module: MMM-RAIN-MAP
 */

Module.register("MMM-RAIN-MAP", {
	defaults: {
		animationSpeedMs: 600,
		defaultZoomLevel: 5,
		displayClockSymbol: true,
		displayOnRainOnly: false,
		displayTime: true,
		extraDelayLastFrameMs: 2000,
		googleBackgroundColor: "rgba(0, 0, 0, 0)",
		googleDisableDefaultUI: true,
		googleKey: "",
		googleMapTypeId: "terrain",
		map: "OSM",
		mapHeightPx: 420,
		mapWidthPx: 420,
		markers: [
			{ lat: 50, lng: 9.27, zoom: 8, color: "red", hidden: false },
			{ lat: 50, lng: 9.27, zoom: 4, color: "red", hidden: true },
		],
		markerChangeInterval: 1,
		rainIcons: ["09d", "09n", "10d", "10n", "11d", "11n", "13d", "13n"],
		overlayOpacity: 0.65,
		timeFormat: config.timeFormat || 24,
		updateIntervalMs: 300000,
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
		console.log("rainmap FE started");
		this.scheduleUpdate(this.updateIntervalMs);
		this.requestPrerenderedImage();
	},

	getDom: function () {
		let app = document.createElement("div");

		app.innerHTML =
			"<div><span id='weather-map-loading'><span id='weather-map-loading-status'></span>Map is loaded.&nbsp;<i class='fas fa-satellite'></i></span><img style='display: none;' id='weather-map-prerendered' src=''></div>";

		return app;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "RAIN_MAP_PRERENDER_SUCCESS") {
			const path = "modules/MMM-RAIN-MAP/public/" + payload;
			console.log("Set img path", path);
			document.getElementById("weather-map-prerendered").src = path;
			document.getElementById("weather-map-prerendered").style.display =
				"block";
			document.getElementById("weather-map-loading").style.display = "none";
		} else if (notification === "RAIN_MAP_PRERENDER_STATUS") {
			document.getElementById("weather-map-loading-status").innerHTML = payload;
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
		console.log("rainmap FE Set schedule");
		const self = this;
		setInterval(function () {
			console.log("rainmap FE Socket");
			this.requestPrerenderedImage();
		}, self.config.updateIntervalMs);
	},
});
