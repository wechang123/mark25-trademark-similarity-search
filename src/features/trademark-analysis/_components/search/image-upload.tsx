"use client";

import { useState, useRef, ChangeEvent, useCallback, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import Image from "next/image";
import { Upload, X, FileImage, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { convertImageToJpg151 } from '@/shared/utils/utils'
import { PreviewModal } from "./preview-modal";

interface ImageUploadProps {
  onFileUpload: (file: File | null) => void;
  acceptedFileTypes?: string[];
  placeholder?: string;
  className?: string;
  maxSize?: number; // MB 단위
  forceJpg151?: boolean;
}

export function ImageUpload({
  onFileUpload,
  acceptedFileTypes = ["image/*"],
  placeholder = "파일을 업로드하세요",
  className,
  maxSize = 10, // 기본 10MB
  forceJpg151,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "validating" | "converting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to process file automatically when selected
  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const process = async () => {
      // 1. Validation
      setStatus("validating");
      
      // acceptedFileTypes props를 기반으로 검증 (보안 강화)
      const allowedMimeTypes = acceptedFileTypes.map(type => {
        if (type === "image/*") return ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (type === "image/jpeg") return "image/jpeg";
        if (type === "image/jpg") return "image/jpeg"; // 정규화
        if (type === "image/png") return "image/png";
        if (type === "application/pdf") return "application/pdf";
        if (type === "image/tiff") return "image/tiff";
        return type;
      }).flat();
      
      if (!allowedMimeTypes.includes(selectedFile.type)) {
        const allowedExtensions = acceptedFileTypes.map(type => {
          if (type.includes("jpeg")) return "JPG";
          if (type.includes("png")) return "PNG";
          if (type.includes("pdf")) return "PDF";
          if (type.includes("tiff")) return "TIFF";
          return type.split("/")[1]?.toUpperCase();
        }).filter(Boolean).join(", ");
        
        alert(`지원하지 않는 파일 형식입니다. ${allowedExtensions} 파일만 업로드 가능합니다.`);
        handleRemoveFile();
        return;
      }
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        alert(`파일 용량은 ${maxSize}MB 이하여야 합니다.`);
        handleRemoveFile();
        return;
      }
      if (selectedFile.type.startsWith("image/")) {
        const img = new window.Image();
        img.src = URL.createObjectURL(selectedFile);
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("유효하지 않은 이미지 파일입니다."));
            });
            if (img.width < 50 || img.height < 50) {
                alert("이미지 크기는 최소 50x50px 이상이어야 합니다.");
                handleRemoveFile();
                return;
            }
        } catch (e: any) {
            alert(e.message);
            handleRemoveFile();
            return;
        }
      }

      // 2. Conversion (if needed)
      if (forceJpg151 && selectedFile.type.startsWith("image/")) {
        setStatus("converting");
        try {
          // 4cm × 4cm JPG 형식으로 자동 변환
          const convertedFile = await convertImageToJpg151(selectedFile);
          setFinalFile(convertedFile);
          onFileUpload(convertedFile);
          setPreviewUrl(URL.createObjectURL(convertedFile));
          setStatus("success");
        } catch (e) {
          alert("이미지 규격 변환에 실패했습니다. 다른 파일을 시도해주세요.");
          handleRemoveFile();
        }
      } else {
        // 3. Success (no conversion)
        setFinalFile(selectedFile);
        onFileUpload(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setStatus("success");
      }
    };

    process();
  }, [selectedFile, forceJpg151, maxSize, onFileUpload]);

  const handleFileSelection = (file: File) => {
    // Reset previous state
    setStatus("idle");
    setError(null);
    setFinalFile(null);
    setPreviewUrl(null);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFinalFile(null);
    setStatus("idle");
    setError(null);
    setPreviewUrl(null);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileUpload]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FileImage className="w-12 h-12 text-blue-500" />;
    if (file.type === "application/pdf") return <FileText className="w-12 h-12 text-red-500" />;
    return <FileText className="w-12 h-12 text-neutral-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderStatus = () => {
    switch (status) {
      case "converting":
        return <div className="flex items-center text-yellow-600 font-semibold"><Loader2 className="w-5 h-5 mr-1 animate-spin" />규격에 맞게 변환 중...</div>;
      case "success":
        return <div className="flex items-center text-success-600 font-bold"><CheckCircle2 className="w-5 h-5 mr-1" />업로드 완료</div>;
      case "error":
        return <div className="text-red-500 font-semibold">{error}</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className={className}>
        <CardContent className="p-4">
          <input ref={fileInputRef} type="file" accept={acceptedFileTypes.join(",")} onChange={handleFileInputChange} className="hidden" />
          
          {status === 'idle' ? (
            <div className={`w-full p-6 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center min-h-[220px] justify-center cursor-pointer transition-colors ${dragActive ? 'border-brand-500 bg-info-50' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} tabIndex={0} role="button">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">{placeholder}</p>
              <p className="text-sm text-neutral-500">클릭하거나 파일을 드래그하여 업로드하세요</p>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, PDF, TIFF 형식, {maxSize}MB 이하</p>
            </div>
          ) : (
            <div className="w-full p-6 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col md:flex-row items-center min-h-[220px] gap-6">
              <div className="w-48 h-48 flex items-center justify-center">
                {finalFile && previewUrl && finalFile.type.startsWith('image/') ? (
                  <Image src={previewUrl} alt="미리보기" width={256} height={256} className="w-full h-full object-contain bg-white rounded shadow border border-neutral-200" />
                ) : finalFile ? (
                  getFileIcon(finalFile)
                ) : <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />}
              </div>
              <div className="flex flex-col flex-1 items-start justify-center gap-2">
                <p className="font-medium text-gray-900 truncate w-full">{finalFile?.name || selectedFile?.name}</p>
                {finalFile && <p className="text-sm text-neutral-500">{formatFileSize(finalFile.size)}</p>}
                <div className="h-6">{renderStatus()}</div>
                <div className="flex gap-2 mt-2 items-center flex-wrap">
                  {finalFile && status === 'success' && <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="text-info-600 border-blue-500 font-semibold">미리보기</Button>}
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 px-2 h-8 min-w-[48px] text-base">삭제</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {finalFile && (
        <PreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fileUrl={previewUrl || ""}
          fileType={finalFile.type}
          onReupload={handleRemoveFile}
        />
      )}
    </>
  );
}
