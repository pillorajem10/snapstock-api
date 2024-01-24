// DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

//FUNCTIONS
const app = express();
const port = 4000;
const server = http.createServer(app);



//MIDDLEWARES
app.use(cors());
dotenv.config();
app.use(bodyParser.json());



//IMPORTED ROUTES
const product = require('./app/routes/product');
const order = require('./app/routes/order');
const delivery = require('./app/routes/delivery');
const user = require('./app/routes/user');
const auth = require('./app/routes/auth');
const category = require('./app/routes/category');



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
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');

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




// LISTENER
server.listen(port, () => {
  console.log("Server is running on Port: " + port);
});
