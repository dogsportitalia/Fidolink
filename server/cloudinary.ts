import { v2 as cloudinary } from "cloudinary";

// Supports both CLOUDINARY_URL (single var) and separate vars
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadDogPhoto(base64Data: string, tagPublicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    public_id: `fidolink/dogs/${tagPublicId}`,
    overwrite: true,
    transformation: [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}
