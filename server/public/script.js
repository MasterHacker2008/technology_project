// Connect to WebSocket server for real-time communication
const ws = new WebSocket("ws://192.168.1.1:3000");
// const ws = new WebSocket("wss://flood-barrier-server.onrender.com");

// Get references to HTML elements for the UI controls
let deployToggle = document.getElementById("deployToggle");
let barrierStatus = document.getElementById("barrierStatus");
let waterLevel = document.getElementById("waterLevel");

// Get references to sensor control elements
let autoDeployToggle = document.getElementById("autoDeployToggle");
let sensorStatus = document.getElementById("sensorStatus");

// Default reference water level in cm
let ground = 2; // default flood level in cm

// Update the barrier UI to show deployed or closed status
function updateBarrierUI(status) {
  // Update the toggle switch position
  deployToggle.checked = status;

  // Update text and colors based on barrier status
  if (status) {
    barrierStatus.classList.remove("red-text");
    barrierStatus.classList.add("green-text");
    barrierStatus.textContent = "Deployed";
  } else {
    barrierStatus.classList.remove("green-text");
    barrierStatus.classList.add("red-text");
    barrierStatus.textContent = "Closed";
  }
}

// Update water level display based on sensor distance
function updateWaterUI(distance) {
  waterLevel.textContent = Math.abs(ground - distance) + " cm";
}

// Send deploy command to the server
function deployBarrier() {
  ws.send(JSON.stringify({ action: "deploy", from: "web" }));
}

// Send retract command to the server
function closeBarrier() {
  ws.send(JSON.stringify({ action: "retract", from: "web" }));
}

// Request initial state from the server
function initialState() {
  ws.send(JSON.stringify({ action: "init", from: "web" }));
}

// Did not have time to implement custom flood level setting from the UI
// function setLevel(level) {
//   ws.send(JSON.stringify({ action: "level", value: level, from: "web" }));
// }

// Toggle the automatic sensor monitoring
function sensor(status) {
  ws.send(
    JSON.stringify({ action: "sensorStatus", value: status, from: "web" }),
  );
}

// Event listener for deploy/close toggle switch
deployToggle.addEventListener("change", function () {
  if (this.checked) {
    deployBarrier();
  } else {
    closeBarrier();
  }
});

// Event listener for automatic sensor toggle switch
autoDeployToggle.addEventListener("change", function () {
  if (this.checked) {
    // Turn on sensor monitoring
    sensorStatus.textContent = "Active";
    sensorStatus.classList.remove("red-text");
    sensorStatus.classList.add("green-text");
    sensor(true);
  } else {
    // Turn off sensor monitoring
    sensorStatus.textContent = "Inactive";
    sensorStatus.classList.remove("green-text");
    sensorStatus.classList.add("red-text");
    sensor(false);
    waterLevel.textContent = "--";
  }
});

// document
//   .getElementById("setLevelButton")
//   .addEventListener("click", function () {
//     const level = document.getElementById("levelInput").value;
//     setLevel(level);
//   });

// Called when WebSocket connection is established
ws.onopen = () => {
  console.log("Connected to server");
  initialState();
};

// Handle incoming messages from the server
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Update barrier deployment status
  if (data.type === "status") {
    updateBarrierUI(data.barrier);
    console.log("Updated barrier status from server");
  }
  // Update water level reading from sensor
  else if (data.type === "water_level") {
    updateWaterUI(data.distance);
  }
  // Handle initial state response from server
  else if (data.type === "init") {
    updateBarrierUI(data.barrier);
    autoDeployToggle.checked = data.sensor;
    data.sensor
      ? ((sensorStatus.textContent = "Active"),
        sensorStatus.classList.remove("red-text"),
        sensorStatus.classList.add("green-text"))
      : ((sensorStatus.textContent = "Inactive"),
        sensorStatus.classList.remove("green-text"),
        sensorStatus.classList.add("red-text"));
  }
};
