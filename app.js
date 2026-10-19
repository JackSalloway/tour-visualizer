// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    let markerPlacementMode = false; // Variable to toggle between placement mode and normal mode
    let placedMarkers = []; // Variable to store references to the markers placed in placement mode

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

    // Function to update the sidebar content. Called when a marker is added to the map
    function renderPlacedMarkers() {
        const placedMarkersList = document.getElementById(
            "placed-markers-list",
        );

        // Replace the child elements of the placed markers list with the new list of markers
        placedMarkersList.replaceChildren(
            ...placedMarkers.map((marker) => {
                const { lat, lng } = marker.getLatLng(); // Get marker location values
                const item = document.createElement("li"); // Create a new list item element
                item.textContent = `Marker at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                return item; // Return the new list item element back to the map function
            }),
        );
    }

    // Function to produce a JSON array with the values of placed markers
    function buildPlacedMarkerJSON() {
        // Map over the array to produce an array of formatted values for each marker
        const placedMarkerData = placedMarkers.map((marker, index) => {
            const { lat, lng } = marker.getLatLng(); // Get marker location values
            return {
                id: index, // Assign a unique ID
                name: `Stop ${index + 1}`, // Assign a basic name
                lat: lat, // Assign the lat value
                lng: lng, // Assign the lng value
                scripts: [], // Placeholder array of strings for scripts associated with the marker, made an array to allow for paragraphs if wanted
                instructions: [], // Placeholder array of strings for instructions associated with the marker, made an array to allow for paragraphs if wanted
            };
        });
        return JSON.stringify(placedMarkerData, null, 2); // Return the formatted JSON string with indentation
    }

    // Function to handle the state change when toggling the sidebar
    function setSidebarStates() {
        // Assign variables to container components
        const tourInformationContainer = document.getElementById(
            "tour-information-container",
        );
        const placedMarkersContainer = document.getElementById(
            "placed-markers-container",
        );

        if (markerPlacementMode) {
            placedMarkersContainer.hidden = false;
            tourInformationContainer.hidden = true;
            map.getContainer().style.cursor = "crosshair";
        } else {
            placedMarkersContainer.hidden = true;
            tourInformationContainer.hidden = false;
            map.getContainer().style.cursor = "";
        }
    }

    // Allow the user to add markers by left clicking on the map when marker placement mode is enabled
    map.on("click", (e) => {
        if (!markerPlacementMode) return; // Do nothing if marker placement mode is not enabled
        const marker = L.marker(e.latlng).addTo(map);
        placedMarkers.push(marker);
        renderPlacedMarkers(); // Update the sidebar content with the new list of markers
        console.log(buildPlacedMarkerJSON()); // Log the JSON representation of the placed markers to the console
    });

    // Allow the user to toggle marker placement mode by pressing the M key
    map.on("keydown", (e) => {
        if (e.originalEvent.key.toLowerCase() === "m") {
            markerPlacementMode = !markerPlacementMode;
            setSidebarStates();
        }
    });
}

init();
