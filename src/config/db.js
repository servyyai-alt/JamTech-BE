import mongoose from "mongoose";

let isConnected = false; // Track the connection status

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  
  if (isConnected) {
    console.log("MongoDB is already connected.");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Do not process.exit(1) in a serverless environment
  }
};

export default connectDB;
