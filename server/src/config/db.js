import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  try {
    mongoose.set("bufferCommands", false);
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mini-shopee";
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`MongoDB not reachable (${error.message}). Running with in-memory persistence fallback.`);
    return false;
  }
};

export const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

export default connectDB;
