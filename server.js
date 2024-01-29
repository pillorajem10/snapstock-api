// DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');

// ...

const app = express();
const port = process.env.SERVER === 'LIVE' ? 3074 : 4000;
const frontEndUrl = process.env.SERVER === 'LIVE' ? 'https://snapstock.site' : 'http://localhost:3000';
const server = http.createServer(app);




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
    credentials: true,
  },
});

io.on('connection', (socket) => {
  // console.log('A user connected');

  // Handle join room event
  socket.on('joinRoom', (category) => {
    console.log('ROOM: ', category);
    socket.join(category);
  });

  // Handle disconnect event
  socket.on('disconnect', () => {
    // console.log('User disconnected');
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
