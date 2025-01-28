let bleDevice;
let characteristicsArray = []; // Declare an array to store characteristics

const deviceName = "Homing Tool Tray"; // Change this to your device's name
const bleService = "00001995-0000-1000-8000-00805f9b34fb"; // Replace with your service UUID
// Array of UUIDs to subscribe to
const targetSubscribeUUIDs = [
  // "00001997-0000-1000-8000-00805f9b34fb", // Replace with your UUIDs
  // "00001997-0000-1000-8000-00805f9b34fb", // Example of another UUID
];

const ControlerCharacteristic_uuid = "00001996-0000-1000-8000-00805f9b34fb";
const SpeedCharacteristic_uuid = "00001997-0000-1000-8000-00805f9b34fb";
const LightCharacteristic_uuid = "00001998-0000-1000-8000-00805f9b34fb";

// Connect Button
function connectToBLEDevice(callback) {
  if (bleDevice) {
    bleDevice.gatt.disconnect();
    bleDevice = null;
    console.log("Disconnected from device.");
    return;
  }

  if (!navigator.bluetooth) {
    console.log("Web Bluetooth API is not available in this browser/device!");
    return;
  }

  navigator.bluetooth
    .requestDevice({
      filters: [{ name: deviceName }],
      // acceptAllDevices: true, // if you want to scan without filter
      optionalServices: [bleService],
    })
    .then((device) => {
      bleDevice = device;
      console.log("Connecting to device...");
      device.addEventListener("gattserverdisconnected", onDisconnected);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("Connected!");
      return server.getPrimaryService(bleService);
    })
    .then((service) => {
      // Retrieve all characteristics from the service
      return service.getCharacteristics();
    })
    .then((characteristics) => {
      // Store the characteristics in the array
      characteristicsArray = characteristics;
      console.log("Characteristics array:", characteristicsArray);

      // Iterate over the array of UUIDs
      targetSubscribeUUIDs.forEach((targetSubscribeUUIDs) => {
        // Find the characteristic that matches the UUID
        const targetCharacteristic = characteristicsArray.find(
          (char) => char.uuid === targetSubscribeUUIDs
        );

        if (targetCharacteristic) {
          // Start notifications on the characteristic
          targetCharacteristic
            .startNotifications()
            .then(() => {
              targetCharacteristic.addEventListener(
                "characteristicvaluechanged",
                handleNotifications
              );
              console.log(
                `Subscribed to notifications for characteristic: ${targetCharacteristic.uuid}`
              );
            })
            .catch((error) => {
              console.error("Error starting notifications:", error);
            });
        } else {
          console.log(`Characteristic with UUID ${targetUUID} not found.`);
        }
      });

      // Optionally, call the callback function after subscribing
      if (callback) {
        callback(); // Call the callback function once all subscriptions are done
      }
    })
    .catch((error) => {
      console.error("Bluetooth Error:", error);
    });

  //  // Subscribe to notifications for each characteristic
  //  characteristicsArray.forEach((characteristic) => {
  //   characteristic
  //     .startNotifications()
  //     .then(() => {
  //       characteristic.addEventListener(
  //         "characteristicvaluechanged",
  //         handleNotifications
  //       );
  //     })
  //     .catch((error) => {
  //       console.error("Error starting notifications:", error);
  //     });
  // });
}
// Handle incoming notifications
function handleNotifications(event) {
  const characteristic = event.target; // The characteristic that triggered the event
  const value = characteristic.value; // Get the value of the characteristic

  // Optionally, decode the value depending on your data format
  const decoder = new TextDecoder();
  const receivedData = decoder.decode(value);
  // Log the characteristic UUID and the received data to differentiate them
  console.log(
    `Notification from characteristic: ${characteristic.uuid} : ${receivedData}`
  );
}
function readCharacteristic(targetUUID) {
  if (!characteristicsArray || characteristicsArray.length === 0) {
    console.log("No characteristics available!");
    return;
  }

  // Find the characteristic with the given UUID in the existing array
  const characteristicToRead = characteristicsArray.find(
    (char) => char.uuid === targetUUID
  );

  if (!characteristicToRead) {
    console.log(`Characteristic with UUID ${targetUUID} not found!`);
    return;
  }

  // Read the value from the found characteristic
  characteristicToRead
    .readValue()
    .then((value) => {
      const decoder = new TextDecoder();
      const receivedData = decoder.decode(value);

      speedValueDisplay.textContent = `Speed : ${receivedData}`;
      speedSlider.value = receivedData;

      console.log(`Data received from UUID ${targetUUID}: ${receivedData}`);
    })
    .catch((error) => {
      console.error("Error reading characteristic:", error);
    });
}

function writeCharacteristic(targetUUID, data) {
  if (!characteristicsArray || characteristicsArray.length === 0) {
    console.log("No characteristics available!");
    return;
  }

  // Find the characteristic with the given UUID in the existing array
  const characteristicToWrite = characteristicsArray.find(
    (char) => char.uuid === targetUUID
  );

  if (!characteristicToWrite) {
    console.log(`Characteristic with UUID ${targetUUID} not found!`);
    return;
  }

  // Convert the data into a buffer using TextEncoder
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Write the data to the characteristic
  characteristicToWrite
    .writeValue(dataBuffer)
    .then(() => {
      console.log(`Data sent to UUID ${targetUUID} successfully!`);
    })
    .catch((error) => {
      console.error("Bluetooth Error:", error);
    });
}

// Handle device disconnection
function onDisconnected(event) {
  console.log("Device disconnected:", event.target);
  bleDevice = null;
}

// Prevent text selection and touch selection in fullscreen
function preventSelection(event) {
  event.preventDefault();
}

function preventTouch(event) {
  event.preventDefault();
}

function startControl() {
  connectToBLEDevice(() => {
    readCharacteristic("00001997-0000-1000-8000-00805f9b34fb");
    console.log("Device connected successfully!");
    // Perform any other actions after the connection is successful
    const connectScreen = document.querySelector(".connect-screen");
    const main = document.getElementById("main");

    connectScreen.style.display = "none";
    main.style.display = "flex";

    if (main.requestFullscreen) {
      main
        .requestFullscreen()
        .then(() => {
          if (screen.orientation && screen.orientation.lock) {
            document.addEventListener("selectstart", preventSelection); // Disable text selection in fullscreen
            document.addEventListener("touchstart", preventTouch); // Disable touch selection in fullscreen

            screen.orientation.lock("landscape").catch((err) => {
              console.warn("Could not lock orientation:", err);
            });
          }
        })
        .catch((err) => {
          console.error("Error entering fullscreen:", err);
        });
    } else {
      console.warn("Fullscreen API is not supported by this browser.");
    }
  });
}

function exitControl() {
  localStorage.clear();
  sessionStorage.clear();
  // Reload the page
  location.reload();
  // const connectScreen = document.querySelector('.connect-screen');
  // const main = document.getElementById('main');

  // main.style.display = 'none';
  // connectScreen.style.display = 'flex';

  // if (document.fullscreenElement) {
  //     document.exitFullscreen().catch((err) => {
  //         console.error('Error exiting fullscreen:', err);
  //     });
  // }
}

let lightOn = false;

const upButton = document.getElementById("up");
const downButton = document.getElementById("down");
const leftButton = document.getElementById("left");
const rightButton = document.getElementById("right");

upButton.addEventListener("touchstart", () => move("forward"));
upButton.addEventListener("mousedown", () => move("forward"));
upButton.addEventListener("mouseup", () => move("stop"));
upButton.addEventListener("touchend", () => move("stop"));

downButton.addEventListener("touchstart", () => move("backward"));
downButton.addEventListener("mousedown", () => move("backward"));
downButton.addEventListener("mouseup", () => move("stop"));
downButton.addEventListener("touchend", () => move("stop"));

leftButton.addEventListener("touchstart", () => move("left"));
leftButton.addEventListener("mousedown", () => move("left"));
leftButton.addEventListener("mouseup", () => move("stop"));
leftButton.addEventListener("touchend", () => move("stop"));

rightButton.addEventListener("touchstart", () => move("right"));
rightButton.addEventListener("mousedown", () => move("right"));
rightButton.addEventListener("mouseup", () => move("stop"));
rightButton.addEventListener("touchend", () => move("stop"));

function move(direction) {
  console.log(`Moving ${direction}`);
  if (direction === "forward") {
    writeCharacteristic(ControlerCharacteristic_uuid, "F");
  } else if (direction === "backward") {
    writeCharacteristic(ControlerCharacteristic_uuid, "B");
  } else if (direction === "left") {
    writeCharacteristic(ControlerCharacteristic_uuid, "L");
  } else if (direction === "right") {
    writeCharacteristic(ControlerCharacteristic_uuid, "R");
  } else if (direction === "stop") {
    writeCharacteristic(ControlerCharacteristic_uuid, "S");
  }
  // Add your logic to send the direction command to the robot
}

const speedSlider = document.getElementById("speed");
const speedValueDisplay = document.getElementById("speed-value");

// Variable to store the current slider value
let currentSpeed = speedSlider.value;
speedValueDisplay.textContent = `Speed : ${currentSpeed}`;
// Function to update speed value
function updateSpeed(value) {
  console.log(`Speed updated to: ${value}`);
  writeCharacteristic(SpeedCharacteristic_uuid, value.toString());
}

// Listen for the input event (to preview the value while dragging)
speedSlider.addEventListener("input", (event) => {
  currentSpeed = event.target.value; // Update the current speed value
  speedValueDisplay.textContent = `Speed : ${currentSpeed}`; // Show live value
});

// Trigger the function only when the slider interaction ends
speedSlider.addEventListener("mouseup", () => {
  updateSpeed(currentSpeed); // Call the function with the final value
});

// For touchscreens, listen to the 'touchend' event
speedSlider.addEventListener("touchend", () => {
  updateSpeed(currentSpeed); // Call the function with the final value
});

function toggleLight() {
  lightOn = !lightOn;
  const lightButton = document.getElementById("light");
  if (lightOn) {
    lightButton.textContent = "Light On";
    lightButton.classList.add("light-on");
    writeCharacteristic(LightCharacteristic_uuid, "1");
  } else {
    lightButton.textContent = "Light Off";
    lightButton.classList.remove("light-on");
    writeCharacteristic(LightCharacteristic_uuid, "0");
  }
  console.log(`Light is now ${lightOn ? "on" : "off"}`);
  // Add your logic to toggle the light on the robot
}

let wakeLock = null;

async function requestWakeLock() {
  try {
    // Check if the browser supports the Screen Wake Lock API
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Screen wake lock acquired");
    } else {
      console.log("Screen Wake Lock API not supported");
    }
  } catch (err) {
    console.error("Failed to acquire wake lock:", err);
  }
}

// Request wake lock when the page is loaded
window.addEventListener("load", () => {
  requestWakeLock();
});
