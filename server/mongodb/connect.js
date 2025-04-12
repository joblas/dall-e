import mongoose from 'mongoose';

const connectDB = (url) => {
  console.log('Attempting to connect to MongoDB...');
  
  // Set mongoose options
  mongoose.set('strictQuery', true);
  
  // Add connection options for better reliability
  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
  };
  
  return mongoose.connect(url, connectionOptions)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => {
      console.error('Failed to connect with MongoDB:', err);
      console.error('Connection string used (redacted):', url ? url.substring(0, 8) + '...' : 'undefined');
      throw err; // Re-throw to handle in the server startup
    });
};

export default connectDB;