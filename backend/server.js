const express = require('express');
// const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

// Allow requests from your frontend's domain
app.use(cors({
    origin:'https://facebook-lite.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['*']
  }))


// Connecting with Atlas MongoDB
mongoose.connect("mongodb+srv://ashwanix2749:2749@cluster0.3x8suve.mongodb.net/", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(error => {
    console.log('Error connecting to MongoDB Atlas:', error);
});

mongoose.connection.on('error', err => {
    console.log('Error in MongoDB connection:', err);
});

// Require your models
require('./models/user');
require('./models/post');

// Using middlewares
app.use(express.json()); // Parse request data to JSON

// Using your routes
app.use(require('./Routes/auth'));
app.use(require('./Routes/post'));
app.use(require('./Routes/user'));

// Listening to port
const port = 5000; // Use environment variable if provided, otherwise use 5000
app.listen(port, () => {
    console.log('Server is running on port: ' + port);
});
