import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseAdmin = null;

try {
  const localPath = path.resolve("src/config/serviceAccountKey.json");
  const renderPath = "/etc/secrets/serviceAccountKey.json";

  const filePath = process.env.RENDER ? renderPath : localPath;

  const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));

  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized");
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error.message);
  console.warn("Push notifications will be disabled.");
}

export default firebaseAdmin;
export { admin };
