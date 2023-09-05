process.chdir(__dirname);
require("dotenv").config();
const { WebSocket } = require("ws");
const EventEmitter = require("events");
const log = new (require('node-windows').EventLogger)('autozoom');
const { exec } = require('child_process');

const ee = new EventEmitter();
ee.on("doWebSocket", () => {
  const client = new WebSocket(process.env.CONNECT_URL);
  let isAlive=false;
  client.on("open", () => {
    log.info("Websocket opened.")
    client.ping();
    const pingTimer = setInterval(() => {
      if (!isAlive) {
        client.terminate();
        clearInterval(pingTimer);
        ee.emit("doWebSocket");
      } else {
        isAlive = false;
        client.ping();
      }
    }, 30000);
  });
  client.on("pong", () => {
    isAlive = true;
  });
  client.on("error", (e) => {
    setTimeout(() => {
      client.terminate()
      ee.emit("doWebSocket")
    },30000);
  })
  client.on("message", (data) => {
    // console.log(data.toString());
    const sentData = data.toString();
    const sentLines = sentData.split(/\r?\n/);
    const zoomURL = sentLines.find((line) => line.includes("https://"));
    const zoomValues = zoomURL?.split("/");
    const meetingNumber = zoomValues?.pop();
    // console.log("meetingNumber", meetingNumber);
    exec(
      `"c:/Program Files/Zoom/bin/Zoom.exe" --url="zoommtg://zoom.us/join?action=join&confno=${meetingNumber}"`,
    );
    log.info(`Started meeting ${meetingNumber}.`)
  });
});

ee.emit("doWebSocket");
