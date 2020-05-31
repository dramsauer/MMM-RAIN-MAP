# MMM-RAIN-MAP

A Rain Radar Map for [Magic Mirror](https://magicmirror.builders/) based on the [Rainviewer API](https://github.com/rainviewer/rainviewer-api-example).  
Click here for the [Forum Thread](https://forum.magicmirror.builders/topic/12808/mmm-rain-map).

## Features

- Shows Rainviewer.com rain data on OpenStreetMap
- Option to support multiple, alternating zoom levels
- Option to only show on rain (dependency to currentweather module)
- Option to add markers on map
  ![](docs/OSM_ScreenCast.gif)

## Installing the Module

- Navigate to the MagicMirror subfolder "modules" and execute the following commands

```sh
git clone https://github.com/jalibu/MMM-RAIN-MAP.git

sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev libjpeg8-dev -y

npm i
```

- Add the module in the `config/config.js` file:

### Sample configuration

```javascript
{
	module: "MMM-RAIN-MAP",
	position: "top_left",
	config: {
		animationSpeedMs: 600,
		chromePath: "/usr/bin/chromium-browser",
		defaultZoomLevel: 5,
		displayClockSymbol: true,
		displayOnRainOnly: false,
		displayTime: true,
		extraDelayLastFrameMs: 2000,
		mapHeightPx: 420,
		mapWidthPx: 420,
		markers: [
			{ lat: 50, lng: 8.27, hidden: false, zoom: 5, color: "red", },
			{ lat: 50, lng: 8.27, hidden: true, zoom: 8}
		],
		markerChangeInterval: 1,
		overlayOpacity: 0.65,
		timeFormat: 24,
		updateIntervalMs: 300000,
	}
}
```

## Options

### General options

| Option                  | Description                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animationSpeed`        | Determines how fast the frames are played. <br><br>**Type:** `int` <br> **Default value:** `600` (time per frame in milliseconds)                                                                          |
| `chromePath`            | Path to chromium executable. May stay null, but I had to set it to "/usr/bin/chromium-browser" on Raspbian.<br><br>**Type:** `string` <br> **Default value:** `null`                                       |
| `defaultZoomLevel`      | Map zoom value. <br><br>**Type:** `integer` <br> **Default value:** `8`                                                                                                                                    |
| `displayTime`           | Display the time for each frame. <br><br>**Type:** `boolean` <br> **Default value:** `true`                                                                                                                |
| `displayClockSymbol`    | Display clock symbol as time prefix. <br><br>**Type:** `boolean` <br> **Default value:** `true`                                                                                                            |
| `displayOnRainOnly`     | If set to true, the map is only displayed when `currentweather module` shows rain or snow icon. <br><br>**Type:** `boolean` <br> **Default value:** `false`                                                |
| `extraDelayLastFrameMs` | Add an extra delay to pause the animation on the latest frame.<br><br>**Type:** `int` <br> **Default value:** `2000` (time in milliseconds)                                                                |
| `mapHeightPx`           | Height of the map. <br><br>**Type:** `int` (pixels) <br> **Default value:** `420`                                                                                                                          |
| `mapWidthPx`            | Width of the map. <br><br>**Type:** `int` (pixels) <br> **Default value:** `420`                                                                                                                           |
| `markers`               | **Required:** Array of markers or center-points in the map.<br> See examples and Markers-Object documentation below for details. <br><br>**Type:** `array[Markers]` <br> **Default value:** `[]`           |
| `markerChangeInterval`  | If you have more than one marker and set this to a value higher than 0, the map jumps from marker to marker after the given number of intervals. <br><br>**Type:** `int` <br> **Default value:** `0` (off) |
| `overlayOpacity`        | Opacity of radar overlay on map. <br><br>**Type:** `float` <br> **Default value:** `0.6`                                                                                                                   |
| `timeFormat`            | Option to override the Magic Mirror's global the time format to 12 or 24 for this module. <br><br>**Type:** `int` <br> **Default value:** `[Global Config]` or `24`                                        |
| `updateIntervalMs`      | Update interval for fetching new radar frames. (New frames are released every 10 minutes) <br><br>**Type:** `int` <br> **Default value:** `300000` (time in milliseconds)                                  |

### Markers Object

| Option   | Description                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lat`    | **Required:** Markers latitude.<br><br>**Type:** `float`                                                                                                                       |
| `lng`    | **Required:** Markers longitude.<br><br>**Type:** `float`                                                                                                                      |
| `zoom`   | Set individual zoom level for marker-jumping mode.<br><br>**Type:** `int`                                                                                                      |
| `color`  | Possible colors: `'black','blue','gold','green','grey','orange','red','violet','yellow'`<br> Note: The color property only works with OpenStreetMap.<br><br>**Type:** `string` |
| `hidden` | Hide this marker on map (i.e. if it should just be a jump-point.<br><br>**Type:** `boolean`                                                                                    |

## Thanks to

- All testers for their feedback
- [MMM-RAIN-RADAR by jojoduquartier](https://github.com/jojoduquartier/MMM-RAIN-RADAR) for inspiration
