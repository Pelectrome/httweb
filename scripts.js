let bleDevice;
let characteristicsArray = []; // Declare an array to store characteristics

const deviceName = "Homing Tool Tray"; // Change this to your device's name
const bleService = "00001995-0000-1000-8000-00805f9b34fb"; // Replace with your service UUID
// Array of UUIDs to subscribe to
const targetSubscribeUUIDs = [
  "00001996-0000-1000-8000-00805f9b34fb", // Replace with your UUIDs
  // "00001997-0000-1000-8000-00805f9b34fb", // Example of another UUID
];

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
  console.log(`Notification from characteristic: ${characteristic.uuid}`);
  console.log(`Data received: ${receivedData}`);
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

let lightOn = false;

function move(direction) {
  console.log(`Moving ${direction}`);
  // Add your logic to send the direction command to the robot
}

function updateSpeed(value) {
  document.getElementById("speed-value").textContent = value;
  console.log(`Speed set to ${value}%`);
  // Add your logic to send the speed value to the robot
}

function toggleLight() {
  lightOn = !lightOn;
  const lightButton = document.getElementById("light");
  if (lightOn) {
    lightButton.textContent = "Light On";
    lightButton.classList.add("light-on");
  } else {
    lightButton.textContent = "Light Off";
    lightButton.classList.remove("light-on");
  }
  console.log(`Light is now ${lightOn ? "on" : "off"}`);
  // Add your logic to toggle the light on the robot
}

function startControl() {
  connectToBLEDevice(() => {
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
