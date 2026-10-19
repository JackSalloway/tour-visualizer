// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    let markerPlacementMode = false; // Variable to toggle between placement mode and normal mode

    // Load the configuration data and use object destructuring to assign required data to variables
    const { image, stops } = await loadConfig();

    // Create an array of coordinates representing the boundaries of the map and store in a variable
    const bounds = [
        [0, 0], // Bottom left corner
        [image.height, image.width], // Top right corner
    ];

    // Create a new leaflet map instance and store it in a variable
    const map = L.map("map-container", {
        crs: L.CRS.Simple, // treats the map as an image, not a globe
        minZoom: -2,
        maxZoom: 0,
    });

    // Add the map image as an overlay on the leaflet map
    L.imageOverlay(image.filePath, bounds).addTo(map);

    // Fit the map view to the bounds of the image overlay
    map.fitBounds(bounds);

    // Add markers from the stops array in the configuration data
    stops.forEach((stop) => {
        const marker = L.marker([stop.lat, stop.lng]).addTo(map);
    });

    // Allow the user to add markers by left clicking on the map when marker placement mode is enabled
    map.on("click", (e) => {
        if (!markerPlacementMode) return; // Do nothing if marker placement mode is not enabled
        L.marker(e.latlng).addTo(map);
        console.log("Marker added at " + e.latlng.lat + ", " + e.latlng.lng);
    });

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
}

init();
