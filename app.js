let config; // variable to store the configuration data
let map; // variable to globally store a reference to the map object
let markerPlacementMode = false; // Current state of the marker placement mode

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

    // Add the map image as an overlay on the leaflet map
    L.imageOverlay(config.image.filePath, bounds).addTo(map);

    // Fit the map view to the bounds of the image overlay
    map.fitBounds(bounds);

    // Add event listeners
    map.on("click", onMapClick);

    // Allow the user to toggle marker placement mode by pressing the M key
    map.on("keydown", (e) => {
        if (e.originalEvent.key.toLowerCase() === "m") {
            markerPlacementMode = !markerPlacementMode;

            // Change cursor style based on current mode
            map.getContainer().style.cursor = markerPlacementMode
                ? "crosshair"
                : "";
        }
    });

    // Add markers from the stops array in the configuration data
    config.stops.forEach((stop) => {
        const marker = L.marker([stop.lat, stop.lng]).addTo(map);
    });
}

// Function called when the user clicks on the map
function onMapClick(e) {
    if (!markerPlacementMode) return; // Do nothing if marker placement mode is not enabled
    var marker = L.marker(e.latlng).addTo(map);
    console.log("Marker added at " + e.latlng.lat + ", " + e.latlng.lng);
}

init();
