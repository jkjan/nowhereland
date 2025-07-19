import { createClient } from "jsr:@supabase/supabase-js@2";
import { ImageMetadata } from "../types/image-types.ts";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.30";

export class ImageService {
  private supabaseClient: any;
  private initialized = false;

  constructor() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  async initializeImageMagick() {
    if (!this.initialized) {
      const wasmBytes = await Deno.readFile(
        new URL(
          "magick.wasm",
          import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"),
        ),
      );
      await initializeImageMagick(wasmBytes);
      this.initialized = true;
    }
  }

  generateImageHash(buffer: ArrayBuffer): string {
    // Simple hash based on file content
    const view = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(36);
  }

  async getImageDimensions(buffer: ArrayBuffer): Promise<{ width: number; height: number }> {
    await this.initializeImageMagick();
    
    return ImageMagick.read(new Uint8Array(buffer), (img: any) => {
      return {
        width: img.width,
        height: img.height
      };
    });
  }

  async correctImageOrientation(buffer: ArrayBuffer): Promise<Uint8Array> {
    await this.initializeImageMagick();
    
    return ImageMagick.read(new Uint8Array(buffer), (img: any) => {
      img.autoOrient();
      return img.write((data: Uint8Array) => data);
    });
  }

  async convertToWebP(buffer: ArrayBuffer, quality: number = 80): Promise<Uint8Array> {
    await this.initializeImageMagick();
    
    return ImageMagick.read(new Uint8Array(buffer), (img: any) => {
      img.quality = quality;
      return img.write(MagickFormat.Webp, (data: Uint8Array) => data);
    });
  }

  async uploadToStorage(bucket: string, path: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
    const { data, error } = await this.supabaseClient.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  }

  createImageMetadata(width: number, height: number, fileSize: number, mimeType: string): ImageMetadata {
    return {
      original_width: width,
      original_height: height,
      file_size: fileSize,
      mime_type: mimeType,
      created_at: new Date().toISOString()
    };
  }

  async processImage(file: File): Promise<{
    hash: string;
    originalPath: string;
    webpPath: string;
    metadata: ImageMetadata;
  }> {
    await this.initializeImageMagick();
    
    // Read file buffer
    const originalBuffer = await file.arrayBuffer();
    const hash = this.generateImageHash(originalBuffer);
    
    // Get image dimensions
    const dimensions = await this.getImageDimensions(originalBuffer);
    
    // Correct EXIF orientation
    const orientationCorrectedUint8 = await this.correctImageOrientation(originalBuffer);
    const orientationCorrectedBuffer = orientationCorrectedUint8.buffer.slice(orientationCorrectedUint8.byteOffset, orientationCorrectedUint8.byteOffset + orientationCorrectedUint8.byteLength) as ArrayBuffer;
    
    // Convert to WebP
    const webpUint8 = await this.convertToWebP(orientationCorrectedBuffer, 80);
    const webpBuffer = webpUint8.buffer.slice(webpUint8.byteOffset, webpUint8.byteOffset + webpUint8.byteLength) as ArrayBuffer;

    // Upload original file
    const originalPath = `${hash}/original`;
    await this.uploadToStorage('post-images', originalPath, originalBuffer, file.type);

    // Upload WebP version
    const webpPath = `${hash}/${dimensions.width}.webp`;
    await this.uploadToStorage('post-images', webpPath, webpBuffer, 'image/webp');

    // Create metadata and URLs
    const metadata = this.createImageMetadata(dimensions.width, dimensions.height, file.size, file.type);

    return {
      hash,
      originalPath,
      webpPath,
      metadata,
    };
  }
}