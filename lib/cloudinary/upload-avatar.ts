/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary'

// Configurar o Cloudinary apenas uma vez
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadAvatarToCloudinary(file?: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null
  const buffer = Buffer.from(await file.arrayBuffer())

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'user-avatars',
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) reject(error)
        else resolve((result as any).secure_url)
      }
    ).end(buffer)
  })
}

