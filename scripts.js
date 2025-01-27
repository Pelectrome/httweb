let bleDevice;
let bleCharacteristic;

const deviceName = "Homing Tool Tray"; // Change this to your device's name
const bleService = "00001995-0000-1000-8000-00805f9b34fb"; // Replace with your service UUID
const bleCharacteristicUUID = "00001996-0000-1000-8000-00805f9b34fb"; // Replace with your characteristic UUID

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
      acceptAllDevices: true, // if you want to scan without filter
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
      return service.getCharacteristic(bleCharacteristicUUID);
    })
    .then((characteristic) => {
      bleCharacteristic = characteristic;
      console.log("Subscribed to characteristic notifications...");
      // Start notifications on the characteristic
      characteristic
        .startNotifications()
        .then(() => {
          characteristic.addEventListener(
            "characteristicvaluechanged",
            handleNotifications
          );
          if (callback) {
            callback(); // Call the callback function
          }
        })
        .catch((error) => {
          console.error("Error starting notifications:", error);
        });
    })
    .catch((error) => {
      console.error("Bluetooth Error:", error);
    });
}

// Handle incoming notifications
function handleNotifications(event) {
  const value = event.target.value;
  const decoder = new TextDecoder();
  const receivedData = decoder.decode(value);
  console.log(`Data received: ${receivedData}`);
}
function readCharacteristic() {
  if (!bleCharacteristic) {
    console.log("No characteristic to read!");
    return;
  }

  bleCharacteristic
    .readValue()
    .then((value) => {
      const decoder = new TextDecoder();
      const receivedData = decoder.decode(value);
      console.log(`Data received: ${receivedData}`);
    })
    .catch((error) => {
      console.error("Error reading characteristic:", error);
    });
}

function sendData(data) {
  if (!bleDevice || !bleCharacteristic) {
    console.log("Not connected to any device.");
    return;
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  bleCharacteristic
    .writeValue(dataBuffer)
    .then(() => {
      console.log("Data sent successfully!");
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
