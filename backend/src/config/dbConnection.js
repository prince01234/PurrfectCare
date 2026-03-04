import mongoose from "mongoose";
import config from "./config.js";

async function connectDB() {
  try {
    const status = await mongoose.connect(config.mongoDBUrl);

    const conversationsCollection =
      status.connection.collection("conversations");
    const indexes = await conversationsCollection.indexes();
    const legacyUniqueIndex = indexes.find(
      (index) =>
        index.name === "participants_1_context_1_contextRef_1" && index.unique,
    );

    if (legacyUniqueIndex) {
      await conversationsCollection.dropIndex(
        "participants_1_context_1_contextRef_1",
      );
      console.log(
        "Dropped legacy conversation unique index: participants_1_context_1_contextRef_1",
      );
    }

    await conversationsCollection.createIndex(
      { participantKey: 1, context: 1, contextRef: 1 },
      {
        name: "participantKey_1_context_1_contextRef_1",
        unique: true,
        partialFilterExpression: {
          participantKey: { $type: "string" },
        },
      },
    );

    console.log(
      `Database connected successfully at ${status.connection.host} at port ${status.connection.port}`,
    );
  } catch (err) {
    console.error("Database connection failed: ", err.message);

    //exit the process if failure
    process.exit(1);
  }
}

export default connectDB;
