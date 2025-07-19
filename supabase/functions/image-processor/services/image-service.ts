import { createClient } from "jsr:@supabase/supabase-js@2";
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

  async processImage(file: File): Promise<{ hash: string; webp_url: string }> {
    // Read file buffer
    const originalBuffer = await file.arrayBuffer();
    const hash = this.generateImageHash(originalBuffer);
    
    // Convert to WebP
    const webpUint8 = await this.convertToWebP(originalBuffer, 80);
    const webpBuffer = webpUint8.buffer.slice(webpUint8.byteOffset, webpUint8.byteOffset + webpUint8.byteLength) as ArrayBuffer;

    // Upload original file
    const originalPath = `${hash}/original`;
    await this.uploadToStorage('post-images', originalPath, originalBuffer, file.type);

    // Upload WebP version
    const webpPath = `${hash}/image.webp`;
    await this.uploadToStorage('post-images', webpPath, webpBuffer, 'image/webp');

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webp_url = `${supabaseUrl}/functions/v1/image-cdn/${hash}`;

    return {
      hash,
      webp_url,
    };
  }
}