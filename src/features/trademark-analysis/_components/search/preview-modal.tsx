import React from "react";
import Image from "next/image";
import { FileText } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: string;
  onReupload: () => void;
}

export function PreviewModal({ open, onClose, fileUrl, fileType, onReupload }: PreviewModalProps) {
  if (!open) return null;

  const isPdf = fileType === 'application/pdf';

  const handleReupload = () => {
    onClose(); // 먼저 모달을 닫고
    onReupload(); // 그 다음 재업로드 함수를 호출
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-center">업로드 파일 미리보기</h2>
        <div className="flex justify-center items-center mb-6">
            {fileUrl ? (
              isPdf ? (
                <div className="flex flex-col items-center justify-center h-48 w-48 bg-neutral-50 rounded border p-4">
                  <FileText className="w-16 h-16 text-red-500 mb-3" />
                  <div className="text-md text-neutral-700 font-semibold mb-3">PDF Document</div>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-info-600 underline text-sm font-semibold hover:text-info-800">
                    새 탭에서 열기
                  </a>
                </div>
              ) : (
                <Image
                  src={fileUrl}
                  alt="업로드 파일 미리보기"
                  width={512}
                  height={512}
                  className="max-w-full max-h-80 object-contain rounded bg-white"
                />
              )
            ) : <div className="h-48 w-48 flex items-center justify-center bg-neutral-100 rounded text-neutral-500">미리보기 없음</div>}
        </div>
        <div className="flex gap-4 mt-8 justify-center">
          <button
            className="px-8 py-2 bg-neutral-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            className="px-8 py-2 bg-error-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            onClick={handleReupload}
          >
            삭제 및 다시 업로드
          </button>
        </div>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-neutral-700 text-2xl leading-none"
          onClick={onClose}
          aria-label="닫기"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
 