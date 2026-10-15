let config; // variable to store the configuration data

// Function to load the configuration data from the config.json file
async function loadConfig() {
    const response = await fetch("config.json");
    return response.json();
}

// Function to initialize the application after the configuration data has been loaded
async function init() {
    config = await loadConfig();

    console.log("Configuration loaded:", config);
}

init();
