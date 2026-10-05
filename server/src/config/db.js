import mongoose from "mongoose";
import logger from "../utils/logger.js";

let isConnected = false;

const connectDB = async () => {
  try {
    mongoose.set("bufferCommands", false);
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mini-shopee";

    // Setup connection event listeners
    mongoose.connection.on("connected", () => {
      isConnected = true;
      logger.info("MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB disconnected. Falling back to in-memory store.");
    });

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    logger.warn(`MongoDB not reachable (${error.message}). Running with in-memory persistence fallback.`);
    return false;
  }
};

export const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

export default connectDB;
