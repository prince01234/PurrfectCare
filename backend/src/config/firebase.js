import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let firebaseAdmin = null;

try {
  const serviceAccount = require("../../serviceAccountKey.json");

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
