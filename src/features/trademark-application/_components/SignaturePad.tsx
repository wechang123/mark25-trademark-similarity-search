"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import Image from "next/image";
import { Undo2, Download } from "lucide-react";

interface SignaturePadProps {
  onSignatureUpload: (dataUrl: string | null) => void;
  className?: string;
}

export function SignaturePad({
  onSignatureUpload,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 흰색 배경 설정 (JPG 변환 시 필요)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 스타일 설정
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setUploaded(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      // JPG 변환을 위한 임시 캔버스 생성
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // 흰색 배경 적용
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        // 서명 이미지 복사
        tempCtx.drawImage(canvas, 0, 0);
        // JPG로 변환 (품질 0.92)
        const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.92);
        setSignatureData(dataUrl);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 흰색 배경 다시 설정
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureData(null);
    setUploaded(false);
    onSignatureUpload(null);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    
    // JPG 변환을 위한 임시 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // 흰색 배경 적용
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    // 서명 이미지 복사
    tempCtx.drawImage(canvas, 0, 0);
    
    let quality = 0.92;
    let dataUrl = tempCanvas.toDataURL("image/jpeg", quality);
    // 100KB 이하로 반복 압축
    while (dataUrl.length > 100 * 1024 && quality > 0.5) {
      quality -= 0.05;
      dataUrl = tempCanvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > 100 * 1024) {
      alert("100KB 이하로 저장할 수 없습니다. 더 간단하게 그려주세요.");
      return;
    }
    const link = document.createElement("a");
    link.download = "signature.jpg";
    link.href = dataUrl;
    link.click();
  };

  const handleUpload = () => {
    if (signatureData) {
      onSignatureUpload(signatureData);
      setUploaded(true);
    }
  };

  // 터치 이벤트
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setUploaded(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      // JPG 변환을 위한 임시 캔버스 생성
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // 흰색 배경 적용
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        // 서명 이미지 복사
        tempCtx.drawImage(canvas, 0, 0);
        // JPG로 변환 (품질 0.92)
        const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.92);
        setSignatureData(dataUrl);
      }
    }
  };

  if (uploaded && signatureData) {
    return (
      <div className={className + " flex flex-col items-center w-full"}>
        <div className="w-full p-6 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center min-h-[220px]">
          <Image src={signatureData} alt="서명 미리보기" width={256} height={128} className="max-h-32 max-w-full object-contain bg-white rounded" style={{background: 'white'}} />
        </div>
        <span className="text-success-600 font-bold flex items-center mt-2 mb-2">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          업로드 완료
        </span>
        <Button type="button" variant="outline" onClick={() => { setUploaded(false); setSignatureData(null); setHasSignature(false); onSignatureUpload(null); }}>
          다시 그리기
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-sm font-medium text-neutral-700">
            서명을 그려주세요 (JPG, 4cm x 4cm, 100KB 이하로 저장)
          </div>

          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50">
            <canvas
              ref={canvasRef}
              className="w-full h-40 bg-white rounded-xl border-2 border-dashed border-neutral-300 touch-none"
              style={{ minHeight: 120 }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <Button onClick={clearSignature} type="button" variant="outline">지우기</Button>
            <Button
              onClick={handleUpload}
              type="button"
              disabled={!signatureData}
              className="bg-brand-500 text-white"
            >
              업로드
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
