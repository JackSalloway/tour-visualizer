// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    let markerPlacementMode = false; // Variable to toggle between placement mode and normal mode
    let placedMarkers = []; // Variable to store references to the markers placed in placement mode
    let currentStop = -1; // Variable to store the current stop index. -1 = no stop selected
    let currentPanel = "welcome"; // Variabnle to store the current panel key
    let previousPanel = "welcome"; // Variable to store the previous panel key
    // Variable to store references to each of the panels in the sidebar
    const panels = {
        welcome: document.getElementById("welcome-container"),
        tour: document.getElementById("tour-information-container"),
        end: document.getElementById("end-container"),
        marker: document.getElementById("placed-markers-container"),
    };

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

    // Add the tour route image as an overlay ontop of the map image
    L.imageOverlay(image.routeFilePath, bounds, { interactive: false }).addTo(
        map,
    );

    // Fit the map view to the bounds of the image overlay
    map.fitBounds(bounds);

    // Add markers from the stops array in the configuration data, use a ternary operator to set the marker icon if there is one
    stops.forEach((stop, index) => {
        const marker = stop.iconPath
            ? L.marker([stop.lat, stop.lng], {
                  icon: L.icon({
                      iconUrl: stop.iconPath,
                      iconSize: [25, 41], // Defalut leaflet icon size for consistency throughout
                      iconAnchor: [12.5, 41], // Offset the icon so the tip sits exactly on its lat lng values
                  }),
              })
            : L.marker([stop.lat, stop.lng]); // If no icon, use a default leaflet icon instead

        marker.addTo(map);

        // Attach a popup to the marker - effectively acts as mouseover and mouseout events in one
        marker.bindTooltip(`<strong>${stop.name}</strong><br>Stop ${stop.id}`, {
            direction: "top",
            offset: stop.iconPath == "" ? [-14, -11] : [1, -41],
        });

        // Add click event listener to update the sidebar when a marker is clicked
        marker.on("click", () => updateSidebarContent(index));
    });

    // Function to hide all panels except the currently selected one
    function showPanel(name) {
        Object.values(panels).forEach((panel) => (panel.hidden = true));
        panels[name].hidden = false;
        currentPanel = name;
    }

    // Function to update the value of the sidebar when a marker is clicked, or the next stop button is clicked
    function updateSidebarContent(stopIndex) {
        currentStop = stopIndex; // Update the value of current stop

        const currentStopData = stops[stopIndex];
        const tourInformationContainer = document.getElementById(
            "tour-information-container",
        );
        const tourInformationHeader = document.getElementById(
            "tour-information-header",
        );
        let stopImage = document.getElementById("stop-image");

        // Update the text content of the header
        tourInformationHeader.textContent = currentStopData.name;

        // Check if the stop has an image
        if (currentStopData.image.path) {
            // Check if the image element already exists, create it if not
            if (!stopImage) {
                stopImage = document.createElement("img");
                stopImage.id = "stop-image";
                tourInformationContainer.prepend(stopImage);
            }

            // Update the image src value
            stopImage.src = currentStopData.image.path;
            stopImage.alt = currentStopData.image.altText;
        } else if (stopImage) {
            stopImage.remove(); // Remove the image element if its in the DOM but the current stop doesn't have an image path value
        }

        // Assign the div element that will contain the information text to a variable
        let sidebarTextContainer = document.getElementById(
            "tour-information-text-container",
        );

        // Create a list of paragraph elements for the current stop
        const paraNodes = currentStopData.text.map((text) => {
            // Set the text value
            const para = document.createElement("p");

            para.textContent = text.value;

            // Set the style values
            text.type === "script"
                ? para.classList.add("script")
                : para.classList.add("information");

            // Pan the map to centre on the current stop
            map.flyTo([currentStopData.lat, currentStopData.lng], 0);

            return para;
        });

        // Replace the child elements of the div with the new content
        sidebarTextContainer.replaceChildren(...paraNodes);
    }

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
                id: index + 1, // Assign a unique ID
                name: `Stop ${index + 1}`, // Assign a basic name
                lat: lat, // Assign the lat value
                lng: lng, // Assign the lng value
                iconPath: "", // Placeholder string that points to the location of the custom icon image
                image: {
                    path: "", // Placeholder string that points to the location of the image
                    altText: "", // Placeholder string to describe the images alternative text
                },
                // Placeholder array of objects, containing a type and value property. These type values will be used to distinguish between scripts and information
                text: [
                    {
                        type: "",
                        value: "",
                    },
                ],
            };
        });

        return JSON.stringify(placedMarkerData, null, 2); // Return the formatted JSON string with indentation
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
            markerPlacementMode = !markerPlacementMode; // toggle the value of markerPlacementMode

            // Check if markerPlacement mode is enabled. Shows the marker panel if true, previous panel if false
            if (markerPlacementMode) {
                previousPanel = currentPanel;
                showPanel("marker");
                map.getContainer().style.cursor = "crosshair";
            } else {
                showPanel(previousPanel);
                map.getContainer().style.cursor = "";
            }
        }
    });

    const startTourButton = document.getElementById("start-tour-button");
    startTourButton.addEventListener("click", (e) => {
        updateSidebarContent(0);
        showPanel("tour");
    });

    const nextStopButton = document.getElementById("next-stop-button");
    nextStopButton.addEventListener("click", (e) => {
        if (currentStop === stops.length - 1) {
            map.flyTo([image.height / 2, image.width / 2], -2);
            showPanel("end");
        } else updateSidebarContent(currentStop + 1);
    });

    const endTourButton = document.getElementById("end-tour-button");
    endTourButton.addEventListener("click", (e) => {
        showPanel("welcome");
    });
}

init();
