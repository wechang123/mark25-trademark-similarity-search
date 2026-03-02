/**
 * 상표 분석용 이미지 처리 및 Storage 연동
 */

import { createServerClient } from '@/infrastructure/database/server';

export interface ImageUploadResult {
  success: boolean;
  originalPath?: string;
  processedPath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * 상표 분석용 이미지 업로드
 */
export async function uploadTrademarkImage(
  sessionId: string,
  imageFile: File
): Promise<ImageUploadResult> {
  try {
    console.log('📸 [Storage] Starting trademark image upload:', {
      sessionId,
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    const supabase = await createServerClient();

    // 1. 파일 확장자 추출
    const fileExtension = imageFile.name.split('.').pop() || 'png';
    
    // 2. 원본 이미지 경로 생성
    const originalPath = `originals/${sessionId}/user_upload.${fileExtension}`;

    // 3. Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('trademark-analysis-images')
      .upload(originalPath, imageFile, {
        cacheControl: '3600',
        upsert: true // 동일한 세션의 이미지는 교체
      });

    if (uploadError) {
      console.error('❌ [Storage] Image upload failed:', uploadError);
      return {
        success: false,
        error: `이미지 업로드 실패: ${uploadError.message}`
      };
    }

    console.log('✅ [Storage] Image uploaded successfully:', uploadData.path);

    // 4. 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('trademark-analysis-images')
      .getPublicUrl(originalPath);

    // 5. KIPRIS 제출용 이미지 리사이징 (추후 구현)
    // const processedPath = await processImageForKipris(sessionId, imageFile);

    console.log('🔗 [Storage] Generated public URL:', urlData.publicUrl);

    return {
      success: true,
      originalPath: uploadData.path,
      publicUrl: urlData.publicUrl
    };

  } catch (error) {
    console.error('❌ [Storage] Image processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 처리 중 알 수 없는 오류'
    };
  }
}

/**
 * KIPRIS 제출용 이미지 처리 (151x151 픽셀로 리사이징)
 * 추후 구현 예정
 */
export async function processImageForKipris(
  sessionId: string,
  originalImageFile: File
): Promise<string | null> {
  try {
    console.log('🔄 [Storage] Processing image for KIPRIS submission...');
    
    // TODO: 이미지 리사이징 로직 구현
    // - Canvas API 또는 Sharp 라이브러리 사용
    // - 151x151 픽셀로 리사이징
    // - JPEG 형식으로 변환
    // - processed/${sessionId}/kipris_submission.jpg 경로에 저장
    
    console.log('⚠️ [Storage] KIPRIS image processing not implemented yet');
    return null;

  } catch (error) {
    console.error('❌ [Storage] KIPRIS image processing failed:', error);
    return null;
  }
}

/**
 * 세션의 모든 이미지 파일 조회
 */
export async function getSessionImages(sessionId: string): Promise<{
  original?: string;
  processed?: string;
  publicUrls: { original?: string; processed?: string };
}> {
  try {
    const supabase = await createServerClient();

    // 1. 세션 폴더의 파일 목록 조회
    const { data: files, error } = await supabase.storage
      .from('trademark-analysis-images')
      .list(`originals/${sessionId}`, {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ [Storage] Failed to list session images:', error);
      return { publicUrls: {} };
    }

    const result: any = { publicUrls: {} };

    // 2. 원본 이미지 찾기
    const originalFile = files?.find(file => file.name.startsWith('user_upload.'));
    if (originalFile) {
      const originalPath = `originals/${sessionId}/${originalFile.name}`;
      result.original = originalPath;
      
      const { data: urlData } = supabase.storage
        .from('trademark-analysis-images')
        .getPublicUrl(originalPath);
      
      result.publicUrls.original = urlData.publicUrl;
    }

    // 3. 처리된 이미지 찾기 (추후 구현)
    // const processedPath = `processed/${sessionId}/kipris_submission.jpg`;
    // ... 처리된 이미지 URL 생성

    console.log('📋 [Storage] Session images retrieved:', {
      sessionId,
      hasOriginal: !!result.original,
      hasProcessed: !!result.processed
    });

    return result;

  } catch (error) {
    console.error('❌ [Storage] Failed to get session images:', error);
    return { publicUrls: {} };
  }
}

/**
 * 이미지 삭제 (세션 종료 시 사용)
 */
export async function deleteSessionImages(sessionId: string): Promise<boolean> {
  try {
    console.log('🗑️ [Storage] Deleting session images:', sessionId);

    const supabase = await createServerClient();

    // 원본 이미지 삭제
    const { error: deleteError } = await supabase.storage
      .from('trademark-analysis-images')
      .remove([
        `originals/${sessionId}`,
        `processed/${sessionId}`
      ]);

    if (deleteError) {
      console.error('❌ [Storage] Failed to delete session images:', deleteError);
      return false;
    }

    console.log('✅ [Storage] Session images deleted successfully');
    return true;

  } catch (error) {
    console.error('❌ [Storage] Image deletion error:', error);
    return false;
  }
}