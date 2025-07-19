import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.30";

export class CdnService {
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

  async getImageFromStorage(hash: string, path: string): Promise<Uint8Array | null> {
    try {
      const { data, error } = await this.supabaseClient.storage
        .from('post-images')
        .download(path);

      if (error || !data) {
        return null;
      }

      return new Uint8Array(await data.arrayBuffer());
    } catch (error) {
      console.log(`Failed to get ${path}:`, error.message);
      return null;
    }
  }

  async getImageDimensions(buffer: Uint8Array): Promise<{ width: number; height: number }> {
    await this.initializeImageMagick();
    
    return ImageMagick.read(buffer, (img: any) => {
      return {
        width: img.width,
        height: img.height
      };
    });
  }

  async resizeImage(buffer: Uint8Array, targetWidth: number): Promise<Uint8Array> {
    await this.initializeImageMagick();
    
    return ImageMagick.read(buffer, (img: any) => {
      // Get original dimensions
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Calculate height maintaining aspect ratio
      const targetHeight = Math.round((originalHeight * targetWidth) / originalWidth);
      
      // Resize image
      img.resize(targetWidth, targetHeight);
      
      // Set quality and return as WebP
      img.quality = 80;
      return img.write(MagickFormat.Webp, (data: Uint8Array) => data);
    });
  }

  async cacheResizedImage(hash: string, width: number, imageBuffer: Uint8Array): Promise<void> {
    try {
      const path = `${hash}/${width}.webp`;
      
      await this.supabaseClient.storage
        .from('post-images')
        .upload(path, imageBuffer, {
          contentType: 'image/webp',
          upsert: true
        });
    } catch (error) {
      console.error(`Error caching resized image ${hash}/${width}.webp:`, error);
      // Don't throw - caching failure shouldn't break the request
    }
  }

  async processImageRequest(hash: string, width?: number): Promise<Uint8Array> {
    // If no width specified, return main WebP image
    if (!width) {
      const mainWebp = await this.getImageFromStorage(hash, `${hash}/image.webp`);
      if (!mainWebp) {
        throw new Error('Image not found');
      }
      return mainWebp;
    }

    // Check if resized image exists in cache
    const cachedImage = await this.getImageFromStorage(hash, `${hash}/${width}.webp`);
    if (cachedImage) {
      return cachedImage;
    }

    // Get main WebP image to resize
    const mainWebp = await this.getImageFromStorage(hash, `${hash}/image.webp`);
    if (!mainWebp) {
      throw new Error('Image not found');
    }

    // Resize image
    const resizedBuffer = await this.resizeImage(mainWebp, width);

    // Cache the resized image (fire and forget)
    this.cacheResizedImage(hash, width, resizedBuffer).catch(console.error);

    return resizedBuffer;
  }
}