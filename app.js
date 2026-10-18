let config; // variable to store the configuration data
let map; // variable to globally store a reference to the map object

// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    // Load the configuration data and store it in the config variable
    config = await loadConfig();
    console.log("Configuration loaded:", config);

    // Set the leaflet map bounds based on the map.png image dimensions
    const bounds = [
        [0, 0], // Bottom left corner
        [config.image.height, config.image.width], // Top right corner
    ];

    // Create a new leaflet map instance
    map = L.map("map-container", {
        crs: L.CRS.Simple, // treats the map as an image, not a globe
        minZoom: -2,
        maxZoom: 0,
    });

    const image = L.imageOverlay(config.image.filePath, bounds).addTo(map);
    map.fitBounds(bounds);
    map.on("click", onMapClick);
}

// Function called when the user clicks on the map
function onMapClick(e) {
    var marker = L.marker(e.latlng).addTo(map);
    console.log("Marker added at " + e.latlng.lat + ", " + e.latlng.lng);
}

init();
