// Custom class that extends the Leaflet Control class to allow for easy addition of elements to the corners of the map
class CornerControl extends L.Control {
    // Override the onAdd method and return an element to be added to the map
    onAdd() {
        let element; // Variable to store the element that will be added to the map

        if (this.options.imageSrc) {
            // Create an img element if the imageSrc option exists
            element = L.DomUtil.create(
                "img",
                "corner-control map-corner-image",
            );
            element.src = this.options.imageSrc;
            element.alt = this.options.imageAlt ?? "";
        } else {
            // Otherwise, create a div element with text context
            element = L.DomUtil.create("div", "corner-control map-corner-text");
            element.textContent = this.options.text ?? "";
        }

        return element;
    }
}

// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to set the icon for a stop.
function getStopIcon(stop, selected) {
    // Check if the marker is selected, and set its icon accordingly
    const iconPath = selected
        ? stop.icon.selectedPath
        : stop.icon.unselectedPath;

    // Set the icon to the default leaflet version if there is no path in the config
    if (!iconPath) return new L.Icon.Default();

    return L.icon({
        iconUrl: iconPath,
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
    });
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    let markerPlacementMode = false; // Variable to toggle between placement mode and normal mode
    let placedMarkers = []; // Variable to store references to the markers placed in placement mode
    let currentStop = -1; // Variable to store the current stop index. -1 = no stop selected
    let currentPanel = "welcome"; // Variabnle to store the current panel key
    let previousPanel = "welcome"; // Variable to store the previous panel key
    let activeTour; // Variable to store a reference to the current tour object
    let activeTourMarkers = []; // Variable to store references to the markers for the active tour
    // Variable to store references to each of the panels in the sidebar
    const panels = {
        welcome: document.getElementById("welcome-container"),
        tour: document.getElementById("tour-information-container"),
        end: document.getElementById("end-container"),
        marker: document.getElementById("placed-markers-container"),
    };
    const minSidebarWidth = 500; // Minimum width of the sidebar in pixels
    const maxSidebarWidth = window.innerWidth * 0.5; // Maximum width of the sidebar in pixels

    // Load the configuration data and use object destructuring to assign required data to variables
    const { image, tours } = await loadConfig();

    // Set the default tour to the first tour in the tours array
    activeTour = tours[0];

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
        zoomControl: false, // Disable the default zoom control
    });

    // Add the map image as an overlay on the leaflet map
    L.imageOverlay(image.filePath, bounds).addTo(map);

    // Fit the map view to the bounds of the image overlay
    map.fitBounds(bounds);

    // Add content to the corners of the map using the CornerControl class
    // Top left corner
    new CornerControl({
        position: "topleft",
        text: "Ambassador Tour Campus Training",
    }).addTo(map);
    L.control.zoom({ position: "topleft" }).addTo(map); // Add the zoom control underneath the text

    // Bottom left corner
    new CornerControl({
        position: "bottomleft",
        text: "Developed by Elly Winters (BA Digital Art) & Jack Salloway (BSc Computer Science)",
    }).addTo(map);

    // Top right corner
    new CornerControl({
        position: "topright",
        imageSrc: "images/uni_logo.png",
        imageAlt: "University for the Creative Arts Logo",
    }).addTo(map);

    // Create layer groups to store the route and stop markers and add them to the map
    const routeLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);

    // Load the tour data for the default tour
    loadTour(activeTour);

    // Function to load the tour data for the tour provided as an argument
    function loadTour(tour) {
        activeTour = tour;
        activeTourMarkers = [];
        currentStop = -1; // Reset the stop index when the tour is updated

        // Clear the route and marker layers
        routeLayer.clearLayers();
        markerLayer.clearLayers();

        // Add the tour route image to the route layer
        L.imageOverlay(tour.routeFilePath, bounds, {
            interactive: false,
        }).addTo(routeLayer);

        // Add the tour stops as markers on the marker layer
        tour.stops.forEach((stop, index) => {
            const marker = L.marker([stop.lat, stop.lng], {
                icon: getStopIcon(stop, false),
            }).addTo(markerLayer);

            // Update the activeTourMarkers array with the new marker
            activeTourMarkers.push(marker);

            // Attach a tooltip to the marker - effectively acts as mouseover and mouseout events in one
            marker.bindTooltip(`<strong>${stop.name}</strong>`, {
                direction: "top",
                offset: stop.icon.unselectedPath ? [1, -41] : [-14, -11],
            });

            // Attach a click event listener to update the sidebar when the marker is clicked
            marker.on("click", () => {
                updateSidebarContent(index);
                showPanel("tour");
            });
        });
    }

    // Function to hide all panels except the currently selected one
    function showPanel(name) {
        Object.values(panels).forEach((panel) => (panel.hidden = true));
        panels[name].hidden = false;
        currentPanel = name;
    }

    // Function to update the value of the sidebar when a marker is clicked, or the next stop button is clicked
    function updateSidebarContent(stopIndex) {
        currentStop = stopIndex; // Update the value of current stop

        // Set each markers icon, setting the current stops icon as its selected version
        activeTourMarkers.forEach((marker, i) => {
            marker.setIcon(getStopIcon(activeTour.stops[i], i === currentStop));
        });

        const currentStopData = activeTour.stops[stopIndex];
        const tourInformationContainer = document.getElementById(
            "tour-information-container",
        );
        const tourInformationHeader = document.getElementById(
            "tour-information-header",
        );
        const tourInformationTime = document.getElementById(
            "tour-information-time",
        );
        let stopImage = document.getElementById("stop-image");

        // Update the text content of the header
        tourInformationHeader.textContent = currentStopData.name;

        // Update the value of the time information paragraph
        tourInformationTime.textContent = currentStopData.approximateTime;

        // Use a ternary operator to hide the time information paragraph if the current stop does not have an approximate time value
        tourInformationTime.textContent === ""
            ? (tourInformationTime.style.display = "none")
            : (tourInformationTime.style.display = "block");

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

            return para;
        });

        // Pan the map to centre on the current stop
        map.panTo([currentStopData.lat, currentStopData.lng], {
            animate: false,
            duration: 1,
        });

        // Replace the child elements of the div with the new content
        sidebarTextContainer.replaceChildren(...paraNodes);
    }

    // Function to update the sidebar content when marker placement mode is enabled. Called when a marker is added to the map
    function renderPlacedMarkers() {
        document.getElementById("placed-markers-json").value =
            buildPlacedMarkerJSON();
    }

    // Function to produce a JSON array with the values of placed markers
    function buildPlacedMarkerJSON() {
        // Map over the array to produce an array of formatted values for each marker
        const placedMarkerData = placedMarkers.map((marker, index) => {
            const { lat, lng } = marker.getLatLng(); // Get marker location values
            return {
                id: index + 1, // Assign a unique ID
                name: `Stop ${index + 1}`, // Assign a basic name
                approximateTime: "", // Placeholder for the approximate time value
                lat: lat, // Assign the lat value
                lng: lng, // Assign the lng value
                icon: {
                    unselectedPath: "", // Placeholder string that points to the location of the unselected icon variant
                    selectedPath: "", // Placeholder string that points to the location of the selected icon variant
                },
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

    // Add event listeners to the sidebar handle to allow the user to resize it
    const sidebarHandle = document.getElementById("resize-handle");
    // Pointer down event to initiate the resizing of the sidebar when the handle is clicked
    sidebarHandle.addEventListener("pointerdown", (e) => {
        sidebarHandle.setPointerCapture(e.pointerId); // Capture the pointer id in the sidebar handle
        sidebarHandle.classList.add("dragging"); // Update styles
        document.body.style.userSelect = "none"; // Prevent the user from selecting text
    });

    // Pointer move event to resize the sidebar when the handle is dragged
    sidebarHandle.addEventListener("pointermove", (e) => {
        if (!sidebarHandle.hasPointerCapture(e.pointerId)) return; // Ignore mouse movement if the pointer is not captured

        const newWidth = window.innerWidth - e.clientX; // Calculate the new width of the sidebar based on the mouse position

        // Clamp the new width between the sidebar minimum and maximum width values
        const clamped = Math.min(
            Math.max(newWidth, minSidebarWidth),
            maxSidebarWidth,
        );

        // Update the CSS variable to set the sidebar width
        document.documentElement.style.setProperty(
            "--sidebar-width",
            `${clamped}px`,
        );

        // Invalidate the map size to update the layout
        map.invalidateSize();
    });

    // Pointer up event to stop resizing the sidebar when the handle is released
    sidebarHandle.addEventListener("pointerup", (e) => {
        sidebarHandle.releasePointerCapture(e.pointerId); // Release the pointer capture
        sidebarHandle.classList.remove("dragging"); // Update styles
        document.body.style.userSelect = ""; // Allow the user to select text
        map.fitBounds(bounds, { animate: true }); // Fit the map to the bounds of the image overlay (sets the map back to the centre of its container)
    });

    const tourSelector = document.getElementById("tour-selector");
    tours.forEach((tour, index) => {
        // Create the label element
        const label = document.createElement("label");
        label.className = "tour-option";

        // Create input element
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "tour";
        input.value = tour.name;
        input.checked = index === 0; // Set the first tour in the config file to be the default
        input.addEventListener("change", () => {
            if (input.checked) loadTour(tour);
        });

        // Create an element to display text
        const text = document.createElement("span");
        text.textContent = tour.name;

        // Add the elements to the DOM
        label.append(input, text);
        tourSelector.appendChild(label);
    });

    const startTourButton = document.getElementById("start-tour-button");
    startTourButton.addEventListener("click", (e) => {
        updateSidebarContent(0);
        showPanel("tour");
    });

    const nextStopButton = document.getElementById("next-stop-button");
    nextStopButton.addEventListener("click", (e) => {
        // Check if the tour is over
        if (currentStop === activeTour.stops.length - 1) {
            map.flyTo([image.height / 2, image.width / 2], -2, {
                animate: true,
                duration: 1,
            });

            currentStop = -1;

            // Set each markers icon to the unselected version
            activeTourMarkers.forEach((marker, i) =>
                marker.setIcon(getStopIcon(activeTour.stops[i], false)),
            );

            showPanel("end");
        } else updateSidebarContent(currentStop + 1);
    });

    const endTourButton = document.getElementById("end-tour-button");
    endTourButton.addEventListener("click", (e) => {
        showPanel("welcome");
    });

    const copyJSONButton = document.getElementById("copy-json-button");
    copyJSONButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildPlacedMarkerJSON());
        copyJSONButton.textContent = "Copied!";
        setTimeout(() => (copyJSONButton.textContent = "Copy JSON"), 1500);
    });
}

init();
