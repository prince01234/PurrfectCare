import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import https from "https";
import http from "http";

const CLOUDINARY_FOLDER = "PurrfectCare";

/**
 * Generate SHA256 hash of a buffer
 */
function generateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Fetch image from URL and return its buffer
 */
async function fetchImageFromUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith("https") ? https : http;

    protocol
      .get(imageUrl, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}


async function uploadFile(files, existingImageUrls = null) {
  const uploadResults = [];
  const existingUrls = Array.isArray(existingImageUrls)
    ? existingImageUrls
    : existingImageUrls
      ? [existingImageUrls]
      : [];

  // Pre-fetch and hash all existing images
  const existingHashes = {};
  for (const url of existingUrls) {
    try {
      const buffer = await fetchImageFromUrl(url);
      existingHashes[url] = generateHash(buffer);
    } catch (error) {
      console.log(
        `Could not fetch existing image for comparison (${url}):`,
        error.message,
      );
    }
  }

  for (const file of files) {
    const newFileHash = generateHash(file.buffer);

    // Check if image is duplicate by comparing with any existing image
    let isDuplicate = false;
    let duplicateUrl = null;
    for (const [url, hash] of Object.entries(existingHashes)) {
      if (newFileHash === hash) {
        isDuplicate = true;
        duplicateUrl = url;
        break;
      }
    }

    // Skip upload if image is duplicate
    if (isDuplicate) {
      uploadResults.push({
        url: duplicateUrl,
        isDuplicate: true,
      });
      continue;
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_FOLDER,
          },
          (error, data) => {
            if (error) return reject(error);

            resolve(data);
          },
        )
        .end(file.buffer);
    });

    uploadResults.push({
      ...result,
      isDuplicate: false,
    });
  }

  return uploadResults;
}

export default uploadFile;
