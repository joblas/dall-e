import mongoose from 'mongoose';

const connectDB = (url) => {
  console.log('Attempting to connect to MongoDB...');
  
  // Set mongoose options
  mongoose.set('strictQuery', true);
  
  // Add connection options for better reliability
  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase to 30s to allow more time for selection
    heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
    socketTimeoutMS: 45000, // Increase socket timeout to 45s
    connectTimeoutMS: 30000, // Connection timeout
    maxPoolSize: 10, // Maintain up to 10 socket connections
    bufferCommands: true, // Enable command buffering to prevent connection errors
  };
  
  // Increase Mongoose default buffering timeouts
  mongoose.set('bufferTimeoutMS', 30000); // Increase from default 10000ms
  
  // Create a global connection promise that can be awaited elsewhere
  const connectionPromise = mongoose.connect(url, connectionOptions);
  
  return connectionPromise
    .then(() => {
      console.log('Successfully connected to MongoDB');
      // Verify connection after successful connect
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB connection not ready after successful connection!');
      }
      
      // Export the connection for use in other modules
      global.mongooseConnection = mongoose.connection;
      global.mongooseConnected = true;
    })
    .catch((err) => {
      console.error('Failed to connect with MongoDB:', err);
      console.error('Connection string used (redacted):', url ? url.substring(0, 8) + '...' : 'undefined');
      global.mongooseConnected = false;
      throw err; // Re-throw to handle in the server startup
    });
};

export default connectDB;