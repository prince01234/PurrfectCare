import { createServer } from "http";

import config from "./config/config.js";
import connectDB from "./config/dbConnection.js";
import initializeSocket from "./config/socket.js";
import sessionConfig from "./config/session.js";
import "./config/firebase.js";
import "./config/passport.js";
import connectCloudinary from "./config/cloudinary.js";
import reminderScheduler from "./jobs/reminderScheduler.js";
import { setIO } from "./config/realtime.js";
import { createApp } from "./app.js";

const startServer = () => {
  const app = createApp({
    sessionMiddleware: sessionConfig,
    passportEnabled: true,
    loggerEnabled: true,
    corsDebugLogs: true,
  });

  const httpServer = createServer(app);

  connectDB();
  connectCloudinary();

  const io = initializeSocket(httpServer);
  app.set("io", io);
  setIO(io);

  reminderScheduler.startScheduler();

  httpServer.listen(config.port, () => {
    console.log(
      `Server running at ${process.env.APP_URL || `http://localhost:${config.port}`}`,
    );
  });

  return { app, httpServer };
};

startServer();

export default startServer;
