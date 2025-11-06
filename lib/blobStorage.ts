import { put, del, list } from '@vercel/blob';

/**
 * Upload an image to Vercel Blob Storage
 * @param file - File object or Buffer
 * @param filename - Name for the file
 * @returns Object with url and other blob metadata
 */
export async function uploadImageToBlob(file: File | Buffer, filename: string) {
  try {
    // If it's a File object, convert to Buffer
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true, // Adds random suffix to avoid name collisions
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload image to storage');
  }
}

/**
 * Delete an image from Vercel Blob Storage
 * @param url - The blob URL to delete
 */
export async function deleteImageFromBlob(url: string) {
  try {
    await del(url);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error('Failed to delete image from storage');
  }
}

/**
 * List all blobs (useful for debugging)
 */
export async function listAllBlobs() {
  try {
    const { blobs } = await list();
    return blobs;
  } catch (error) {
    console.error('Error listing blobs:', error);
    throw new Error('Failed to list blobs');
  }
}

/**
 * Upload image from base64 string
 * @param base64Data - Base64 encoded image data
 * @param filename - Name for the file
 * @param mimeType - MIME type of the image
 */
export async function uploadBase64ToBlob(
  base64Data: string,
  filename: string,
  mimeType: string
) {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');

    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: mimeType,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error('Error uploading base64 to Vercel Blob:', error);
    throw new Error('Failed to upload image to storage');
  }
}
