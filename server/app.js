import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

// Source - https://stackoverflow.com/a
// Posted by AMS777, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-29, License - CC BY-SA 4.0

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//------------------------------------------------

const app = express();
const server = createServer(app);

app.use(express.static(__dirname + "/public"));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let lastBarrierState = null;
let lastSensorState = null;
//https://medium.com/@leomofthings/building-a-node-js-websocket-server-a-practical-guide-b164902a0c99

const wss = new WebSocketServer({ server });

let picoSocket = null;
const clients = new Set(); // track webpage connections

wss.on("connection", (socket) => {
  console.log("New client connected");

  // Add all clients initially
  clients.add(socket);

  
  socket.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received:", data);

    // Pico identifies itself
    if (data.type === "pico_hello") {
      picoSocket = socket;
      clients.delete(socket); // remove Pico from web clients
      console.log("Pico connected");
      return;
    }

    // Message from website → forward to Pico
    if (data.from === "web" && picoSocket && picoSocket.readyState === 1) {
      picoSocket.send(JSON.stringify(data));
      console.log("Forwarded to Pico:", data);
      return;
    }

    // Message from Pico → broadcast to all webpages
    if (socket === picoSocket) {
      clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  socket.on("close", () => {
    if (socket === picoSocket) {
      picoSocket = null;
      console.log("Pico disconnected");
    }
    clients.delete(socket);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://192.168.1.1:${PORT}`);
});
