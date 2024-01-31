// DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const http = require('http');
const https = require('https');
const socketIO = require('socket.io');
const fs = require('fs');
const shell = require('shelljs');
const { execSync } = require('child_process');

// ...

const app = express();
const port = process.env.SERVER === 'LIVE' ? 3074 : 4000;
const frontEndUrl = process.env.SERVER === 'LIVE' ? 'https://snapstock.site' : 'http://localhost:3000';
const wellSecured = process.env.SERVER === 'LIVE' ? true : false;
// const server = http.createServer(app);

if (process.env.SERVER === 'LIVE') {
  const chownCommandKey = `chown p4tric ${process.env.SSL_KEY}`;
  const chownCommandCert = `chown p4tric ${process.env.SSL_CERT}`;

  try {
    shell.exec(`sudo -S ${chownCommandKey}`/*, { input: `${process.env.SUDO_PASS}\n` }*/);
    shell.exec(`sudo -S ${chownCommandCert}`/*, { input: `${process.env.SUDO_PASS}\n` }*/);
    console.log('Ownership changed successfully.');
  } catch (error) {
    console.error('Error executing sudo command:', error.message);
    process.exit(1);
  }
} else {
  console.log('Ownership change skipped. SERVER is not set to "LIVE".');
}

const server = process.env.SERVER === 'LIVE' ? https.createServer({
  key: fs.readFileSync(process.env.SSL_KEY),
  cert: fs.readFileSync(process.env.SSL_CERT),
}) : http.createServer(app);

//MIDDLEWARES
app.use(cors());
app.use(bodyParser.json());



//IMPORTED ROUTES
const product = require('./app/routes/product');
const order = require('./app/routes/order');
const delivery = require('./app/routes/delivery');
const user = require('./app/routes/user');
const auth = require('./app/routes/auth');
const category = require('./app/routes/category');
const notification = require('./app/routes/notification');



//MONGOOSE CONNECTION
const connection = mongoose.connection;

//MONGOOSE || MDB
mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connection.once('open', () => {
  console.log("connected to database");
})


// SOCKET IO
const io = socketIO(server, {
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
  },
});

io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

io.on('connection', (socket) => {
   console.log('A user connected');

  // Handle join room event
  socket.on('joinRoom', (category, callback) => {
    console.log('ROOM: ', category);

    // Attempt to join the room
    socket.join(category, (error) => {
      if (error) {
        console.error(`Failed to join room ${category}:`, error);
        // Send an acknowledgment to the client indicating failure
        callback({ success: false, error: `Failed to join room ${category}` });
      } else {
        console.log(`Successfully joined room ${category}`);
        // Send an acknowledgment to the client indicating success
        callback({ success: true, message: `Successfully joined room ${category}` });
      }
    });
  });


  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});



//ROUTES
app.use('/product', product);
app.use('/order', order(io));
app.use('/delivery', delivery);
app.use('/user', user);
app.use('/auth', auth);
app.use('/category', category);
app.use('/notification', notification);




// LISTENER
server.listen(port, () => {
  console.log("Server is running on Port: " + port);
  console.log("Front URL", frontEndUrl)
  console.log("SERVER", process.env.SERVER)
});
