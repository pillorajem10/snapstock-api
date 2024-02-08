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

const product = require("./app/routes/product");
const order = require("./app/routes/order");
const delivery = require("./app/routes/delivery");
const user = require("./app/routes/user");
const auth = require("./app/routes/auth");
const category = require("./app/routes/category");
const notification = require("./app/routes/notification");

//MIDDLEWARES
app.use(cors());
app.use(bodyParser.json());

// SOCKET IO
const server = http.createServer(app);
// const io = socketIo(server);

let io;

if (process.env.SERVER === "LIVE") {
  io = socketIo(server);
} else {
  io = socketIo(server, {
    cors: {
      origin: frontEndUrl,
      methods: ["GET", "POST"]
    }
  });
};

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

//ROUTES
app.use("/product", product);
app.use("/order", order(io));
app.use("/delivery", delivery);
app.use("/user", user);
app.use("/auth", auth);
app.use("/category", category);
app.use("/notification", notification);

// LISTENER
server.listen(port, () => {
  console.log("Server is running on Port: " + port);
  console.log("Front URL", frontEndUrl);
  console.log("SERVER", process.env.SERVER);
});
