<<<<<<< HEAD
// DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const tls = require('tls');
const fs = require('fs');

const app = express();
const port = process.env.SERVER === 'LIVE' ? 3074 : 4000;
const frontEndUrl = process.env.SERVER === 'LIVE' ? 'https://snapstock.site' : 'http://localhost:3000';
const wellSecured = process.env.SERVER === 'LIVE' ? true : false;


const loadSSLCredentials = () => {
  return {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
    ca: fs.readFileSync(process.env.SSL_CA), // <-- Add the missing closing parenthesis
  };
};
=======
require("dotenv").config();

// DEPENDENCIES
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const port = process.env.SERVER === "LIVE" ? 3074 : 4000;
const frontEndUrl =
  process.env.SERVER === "LIVE"
    ? "https://snapstock.site"
    : "http://localhost:3000";
>>>>>>> 33e826bd9f37c7de5c247c3f5e40565cedd5bd2d

const product = require("./app/routes/product");
const order = require("./app/routes/order");
const delivery = require("./app/routes/delivery");
const user = require("./app/routes/user");
const auth = require("./app/routes/auth");
const category = require("./app/routes/category");
const notification = require("./app/routes/notification");

// MONGOOSE CONNECTION
const connection = mongoose.connection;

// MONGOOSE || MDB
mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connection.once('open', () => {
  console.log("connected to database");
});

// MIDDLEWARES
app.use(cors());
app.use(bodyParser.json());

<<<<<<< HEAD
// IMPORTED ROUTES
const product = require('./app/routes/product');
const order = require('./app/routes/order');
const delivery = require('./app/routes/delivery');
const user = require('./app/routes/user');
const auth = require('./app/routes/auth');
const category = require('./app/routes/category');
const notification = require('./app/routes/notification');

// SOCKET IO
let server;

if (process.env.SERVER === 'LIVE') {
  // TLS server for live deployment
  const tlsOptions = loadSSLCredentials();
  // server = tls.createServer(tlsOptions, app);
  server = http.createServer(app);
} else {
  // HTTP server for local development
  server = http.createServer(app);
}

const io = socketIO(server, {
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
  },
  rejectUnauthorized: false,
});

io.on('connection', (socket) => {
  console.log('A user connected');
=======
// SOCKET IO
const server = http.createServer(app);
const io = socketIo(server);

//MONGOOSE CONNECTION
const connection = mongoose.connection;
//MONGOOSE || MDB
mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
connection.once("open", () => {
  console.log("connected to database");
});

io.on("connection", (socket) => {
  console.log("A user connected");
>>>>>>> 33e826bd9f37c7de5c247c3f5e40565cedd5bd2d

  // Handle join room event
  socket.on("joinRoom", (category, callback) => {
    console.log("ROOM: ", category);

    // Attempt to join the room
    socket.join(category, (error) => {
      if (error) {
        console.error(`Failed to join room ${category}:`, error);
        // Send an acknowledgment to the client indicating failure
        callback({ success: false, error: `Failed to join room ${category}` });
      } else {
        console.log(`Successfully joined room ${category}`);
        // Send an acknowledgment to the client indicating success
        callback({
          success: true,
          message: `Successfully joined room ${category}`,
        });
      }
    });
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

<<<<<<< HEAD
// ROUTES
app.use('/product', product);
app.use('/order', order(io));
app.use('/delivery', delivery);
app.use('/user', user);
app.use('/auth', auth);
app.use('/category', category);
app.use('/notification', notification);
=======
//ROUTES
app.use("/product", product);
app.use("/order", order(io));
app.use("/delivery", delivery);
app.use("/user", user);
app.use("/auth", auth);
app.use("/category", category);
app.use("/notification", notification);
>>>>>>> 33e826bd9f37c7de5c247c3f5e40565cedd5bd2d

// LISTENER
server.listen(port, () => {
  console.log("Server is running on Port: " + port);
  console.log("Front URL", frontEndUrl);
  console.log("SERVER", process.env.SERVER);
});
