import { SupabaseClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

/**
 * Uploads a Base64 data URI (image/pdf/tiff etc.) to Supabase Storage and returns the public URL.
 *
 * @param supabase - The Supabase client instance (server-side; carries the auth session).
 * @param base64Data - Data URI string (e.g., "data:image/png;base64,..." or "data:application/pdf;base64,...").
 * @param bucket - Storage bucket name.
 * @param userId - Current user's id; used as the first path segment for RLS policies.
 * @param fileNamePrefix - Prefix for the file name (e.g., "trademark", "seal", "resident-registration").
 * @returns public URL string or null on failure/invalid input.
 */
export async function uploadBase64Image(
  supabase: SupabaseClient,
  base64Data: any,
  bucket: string,
  userId: string,
  fileNamePrefix: string
): Promise<string | null> {
  // 1) Validate: must be a non-empty string
  if (typeof base64Data !== "string" || base64Data.length === 0) return null;

  // 2) Already a URL? just pass through
  if (base64Data.startsWith("http")) return base64Data;

  // 3) Must be a proper Data URI (image/*, application/pdf, image/tiff, etc.)
  //    e.g. data:<mime>;base64,<payload>
  const match = base64Data.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    console.warn("Invalid data URI:", fileNamePrefix);
    return null;
  }

  const mimeType = match[1]; // e.g. image/png, application/pdf
  const base64String = match[2]; // base64 payload
  if (!mimeType || !base64String) return null;

  // 🔒 보안: 허용된 MIME 타입만 업로드 가능
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'image/tiff'
  ];
  
  if (!allowedMimeTypes.includes(mimeType)) {
    console.warn(`Blocked unsafe MIME type: ${mimeType} for ${fileNamePrefix}`);
    return null;
  }

  try {
    const fileBuffer = Buffer.from(base64String, "base64");

    // 🔒 추가 보안: 파일 헤더(Magic Number) 검증
    const verifyFileHeader = (buffer: Buffer, expectedMime: string): boolean => {
      const header = buffer.subarray(0, 8);
      
      switch (expectedMime) {
        case 'image/jpeg':
          return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
        case 'image/png':
          return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
        case 'application/pdf':
          return header.subarray(0, 4).toString('ascii') === '%PDF';
        case 'image/tiff':
          return (header[0] === 0x49 && header[1] === 0x49 && header[2] === 0x2A) ||
                 (header[0] === 0x4D && header[1] === 0x4D && header[2] === 0x2A);
        default:
          return true; // 기타 허용된 타입
      }
    };

    if (!verifyFileHeader(fileBuffer, mimeType)) {
      console.warn(`File header mismatch for MIME type: ${mimeType} (${fileNamePrefix})`);
      return null;
    }

    // Derive extension from MIME type
    const ext = (() => {
      const [, subtype] = mimeType.split("/");
      if (!subtype) return "bin";
      // handle tiff variants, pdf, jpeg, png, webp, etc.
      if (subtype.includes("tiff")) return "tiff";
      if (subtype.includes("jpeg") || subtype.includes("jpg")) return "jpg";
      if (subtype.includes("png")) return "png";
      if (subtype.includes("pdf")) return "pdf";
      if (subtype.includes("webp")) return "webp";
      if (subtype.includes("gif")) return "gif";
      return subtype.split("+")[0]; // e.g. svg+xml -> svg
    })();

    const filePath = `${userId}/${fileNamePrefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false, // INSERT only (RLS: INSERT policy만 필요)
      });

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return urlData.publicUrl ?? null;
  } catch (e) {
    console.error("Error uploading base64 file:", e);
    return null;
  }
}
