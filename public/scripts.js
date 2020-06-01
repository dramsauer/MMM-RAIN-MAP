const config2 = {
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
	timeFormat: 24,
	updateIntervalMs: 120000,
};
let config;
let map;
let animationPosition = 0;
let markerPosition = 0;
let radarLayers = [];
let timestamps = [];

const supportedIconColors = [
	"black",
	"blue",
	"gold",
	"green",
	"grey",
	"orange",
	"red",
	"violet",
	"yellow",
];

const postNodeHelperMessage = (notification, data) => {
	if (typeof window.postNodeHelperMessage !== "undefined") {
		window.postNodeHelperMessage({ notification, data });
	} else {
		//console.log("postNodeHelperMessage", { notification, data });
	}
};

const initMap = () => {
	try {
		// Configure height/width
		document.getElementById(
			"rain-map-map"
		).style.height = `${config.mapHeightPx}px`;
		document.getElementById(
			"rain-map-map"
		).style.width = `${config.mapWidthPx}px`;

		// Configure clock
		if (!config.displayClockSymbol) {
			document.getElementById("rain-map-clock").style.display = "none";
		}
		if (!config.displayTime) {
			document.getElementById("rain-map-time-wrapper").style.display = "none";
		}

		// Init Map
		const initialMarker = config.markers[0];
		map = L.map("rain-map-map", {
			zoomControl: false,
			attributionControl: false,
		}).setView(
			[initialMarker.lat, initialMarker.lng],
			initialMarker.zoom || config.defaultZoomLevel
		);

		// Set Markers
		config.markers.forEach((marker) => {
			if (!marker.hidden) {
				const color =
					marker.color && supportedIconColors.includes(marker.color)
						? marker.color
						: "red";
				L.marker([marker.lat, marker.lng], {
					icon: new L.Icon({
						iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
						shadowUrl:
							"https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
						iconSize: [25, 41],
						iconAnchor: [12, 41],
						popupAnchor: [1, -34],
						shadowSize: [41, 41],
					}),
				}).addTo(map);
			}
		});

		// Add general Map Tile layer
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
			.addTo(map)
			.on("load", () => {
				postNodeHelperMessage("MAP_INIT_SUCCESS");
			});
	} catch (err) {}
};

const clearLayers = () => {
	for (const ts of timestamps) {
		if (radarLayers[ts] && map.hasLayer(radarLayers[ts])) {
			map.removeLayer(radarLayers[ts]);
		}
	}
};
const getTimestamps = async () => {
	clearLayers();

	await fetch("https://api.rainviewer.com/public/maps.json")
		.then((response) => response.json())
		.then((data) => {
			timestamps = data;
		});
};

const addRainLayers = async () => {
	const layers = [];
	radarLayers = [];
	animationPosition = 0;
	for (const ts of timestamps) {
		radarLayers[ts] = await new L.TileLayer(
			"https://tilecache.rainviewer.com/v2/radar/" +
				ts +
				"/256/{z}/{x}/{y}/2/1_1.png",
			{
				tileSize: 256,
				opacity: 0.001,
				zIndex: ts,
			}
		)
			.addTo(map)
			.on("load", () => Promise.resolve());
	}
};

const setViewToCurrentMarkerPosition = () => {
	const currentMarker = config.markers[markerPosition];
	map.setView(
		new L.LatLng(currentMarker.lat, currentMarker.lng),
		currentMarker.zoom || config.defaultZoomLevel,
		{
			animation: false,
		}
	);
};

const renderNextFrame = async (init) => {
	if (init) {
		clearLayers();
		timestamps = [];
	}
	if (
		timestamps &&
		timestamps[animationPosition] &&
		radarLayers[timestamps[animationPosition]]
	) {
		radarLayers[timestamps[animationPosition]].setOpacity(0);
	}
	if (!timestamps || timestamps.length === 0) {
		await getTimestamps();
		await addRainLayers();
	} else if (timestamps && animationPosition + 1 === timestamps.length) {
		markerPosition =
			markerPosition + 1 < config.markers.length ? markerPosition + 1 : 0;
		setViewToCurrentMarkerPosition();
		await addRainLayers();
	} else {
		animationPosition++;
	}

	const ts = timestamps[animationPosition];
	if (radarLayers[ts]) {
		await radarLayers[ts].setOpacity(config.overlayOpacity);
	}

	if (config.displayTime) {
		const time = moment(ts * 1000);
		if (config.timezone) {
			time.tz(config.timezone);
		}
		let hourSymbol = "HH";
		if (config.timeFormat !== 24) {
			hourSymbol = "h";
		}

		document.getElementById("rain-map-time").innerHTML = `${time.format(
			hourSymbol + ":mm"
		)}`;
	}
	let hasMore =
		animationPosition + 1 < timestamps.length ||
		markerPosition + 1 < config.markers.length;
	postNodeHelperMessage("RENDER_FRAME_SUCCESS", {
		markerPosition,
		animationPosition,
		ts,
		hasMore,
	});
};

const urlParams = new URLSearchParams(window.location.search);
const configUrlParam = urlParams.get("config");
if (configUrlParam) {
	try {
		const configUrlParamDecoded = atob(configUrlParam);
		config = JSON.parse(configUrlParamDecoded);
		initMap();

		setInterval(() => {
			renderNextFrame();
		}, config.animationSpeedMs);

		setInterval(() => {
			renderNextFrame(true);
		}, 30000);
	} catch (err) {
		console.error("Error parsing config from Query Parameter", err);
	}
}
