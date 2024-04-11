const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

// Load environment variables from config file
dotenv.config({ path: './config.env' });

// Connect to MongoDB
const DB = process.env.CONNECTION_STRING;
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB successfully!');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1); // Exit the process if MongoDB connection fails
});

// Define the port to listen on
const port = process.env.PORT || 3000;

// Start the server
const server = app.listen(port, () => {
  console.log(`App listening on port ${port}...`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error(err.name, err.message);
  console.error('UNHANDLED REJECTION! 🔥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
