// DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

//FUNCTIONS
const app = express();
const port = 4000;



//MIDDLEWARES
app.use(cors());
dotenv.config();
app.use(bodyParser.json());



//IMPORTED ROUTES
const product = require('./app/routes/product');
const order = require('./app/routes/order');
const delivery = require('./app/routes/delivery');



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





//ROUTES
app.use('/product', product);
app.use('/order', order);
app.use('/delivery', delivery);




// LISTENER
app.listen(port, () => {
  console.log("Server is running on Port: " + port);
});
