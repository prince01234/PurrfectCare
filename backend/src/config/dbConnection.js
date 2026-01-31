import mongoose from "mongoose";
import config from "./config.js";

async function connectDB() {
  try {
    const status = await mongoose.connect(config.mongoDBUrl);

    console.log(
      `Database connected successfully at ${status.connection.host} at port ${status.connection.port}`
    );
  } catch (err) {
    console.error("Database connection failed: ", err.message);

    //exit the process if failure
    process.exit(1);
  }
}

export default connectDB;
