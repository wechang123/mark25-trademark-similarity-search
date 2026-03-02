/**
 * 유사 상표 카드 컴포넌트
 * KIPRIS 스타일의 상표 정보 카드
 */

import React, { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils';
import { FileText } from 'lucide-react';
import { SimilarTrademark } from '../../_types/simplified-types';

interface SimilarTrademarkCardProps {
  trademark: SimilarTrademark;
  onClick?: () => void;
}

// 상태별 배지 스타일 매핑
const getStatusBadgeVariant = (status: string): { variant: any; className: string } => {
  switch (status.toLowerCase()) {
    case '등록':
      return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' };
    case '출원':
      return { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    case '거절':
      return { variant: 'default', className: 'bg-red-100 text-red-800 border-red-200' };
    case '포기':
      return { variant: 'default', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    case '소멸':
      return { variant: 'default', className: 'bg-orange-100 text-orange-800 border-orange-200' };
    case '취하':
      return { variant: 'default', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    default:
      return { variant: 'outline', className: '' };
  }
};

export function SimilarTrademarkCard({ trademark, onClick }: SimilarTrademarkCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const statusStyle = getStatusBadgeVariant(trademark.status);

  // 출원/등록 번호 포맷팅
  const formatNumber = (appNum: string | null, regNum: string | null) => {
    if (regNum) return regNum;
    if (appNum) return appNum;
    return '';
  };
  
  // 상태별 버튼 색상
  const getStatusButtonColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case '등록':
        return 'bg-blue-600 text-white';
      case '출원':
        return 'bg-blue-600 text-white';
      case '거절':
        return 'bg-orange-600 text-white';
      case '포기':
        return 'bg-gray-400 text-white';
      case '소멸':
        return 'bg-red-600 text-white';
      case '취하':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      {/* 이미지 영역 */}
      <div 
        className="relative aspect-square bg-white cursor-pointer hover:bg-gray-50 transition-colors p-3"
        onClick={onClick}
      >
        {trademark.imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
              </div>
            )}
            <img
              src={trademark.imageUrl}
              alt={trademark.trademarkName}
              className={cn(
                "w-full h-full object-contain",
                imageLoading && "invisible"
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-4">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">{trademark.trademarkName}</p>
            </div>
          </div>
        )}
      </div>

      {/* 상태 버튼 + 번호 */}
      <div className="flex items-center gap-2 px-3 pb-1">
        <span className={cn("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap", getStatusButtonColor(trademark.status))}>
          {trademark.status}
        </span>
        <span className="text-xs text-blue-600">
          [{trademark.applicationNumber || trademark.registrationNumber || '번호없음'}]
        </span>
      </div>

      {/* 상표명 */}
      <div className="px-3 pb-2">
        <h4 className="font-bold text-sm line-clamp-1" title={trademark.trademarkName}>
          {trademark.trademarkName}
        </h4>
      </div>

      {/* 정보 영역 */}
      <div className="px-3 py-2 space-y-0.5 text-xs">
        {/* 상품분류 - goodsClassificationCode 우선, 없으면 similarGroupCodes 사용 */}
        {(trademark.goodsClassificationCode || (trademark.similarGroupCodes && trademark.similarGroupCodes.length > 0)) && (
          <p className="text-blue-600">
            <span className="text-gray-600">상품분류:</span> {
              trademark.goodsClassificationCode 
                ? trademark.goodsClassificationCode 
                : trademark.similarGroupCodes?.slice(0, 3).join(', ')
            }
            {!trademark.goodsClassificationCode && trademark.similarGroupCodes && trademark.similarGroupCodes.length > 3 && '...'}
          </p>
        )}
        
        {/* 출원인 */}
        <p className="text-blue-600 line-clamp-1" title={trademark.applicantName}>
          <span className="text-gray-600">출원인:</span> {trademark.applicantName}
        </p>
        
        {/* 최종권리자 (현재 데이터에 없으므로 출원인과 동일하게 표시) */}
        {trademark.status === '등록' && (
          <p className="text-blue-600 line-clamp-1" title={trademark.applicantName}>
            <span className="text-gray-600">최종권리자:</span> {trademark.applicantName}
          </p>
        )}
      </div>
    </div>
  );
}