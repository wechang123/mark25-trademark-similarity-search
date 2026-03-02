/**
 * 출원 신청 모달 컴포넌트
 * 
 * 출원자 정보를 입력받아 출원 신청을 처리하는 모달
 */

import React, { useState } from 'react';
import { X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface ApplicantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicantInfo: ApplicantInfo) => Promise<void>;
  trademarkName: string;
  registrationProbability: number;
  isLoading?: boolean;
}

export function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  trademarkName,
  registrationProbability,
  isLoading = false
}: ApplicationModalProps) {
  
  const [formData, setFormData] = useState<ApplicantInfo>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const [errors, setErrors] = useState<Partial<ApplicantInfo>>({});

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Partial<ApplicantInfo> = {};

    if (!formData.name.trim()) {
      newErrors.name = '출원자명을 입력해주세요';
    }

    if (!formData.address.trim() || formData.address.length < 10) {
      newErrors.address = '주소를 10자 이상 입력해주세요';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^[0-9-+().\s]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('출원 신청 중 오류:', error);
    }
  };

  // 입력 필드 변경 처리
  const handleInputChange = (field: keyof ApplicantInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <Card className="border-2">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    상표 출원 신청
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    출원자 정보를 입력하여 출원 절차를 시작하세요
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* 상표 정보 요약 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    출원 상표: {trademarkName}
                  </h4>
                  <p className="text-sm text-blue-700">
                    등록 가능성: {registrationProbability}%
                  </p>
                </div>
                <Badge 
                  variant={registrationProbability >= 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {registrationProbability >= 70 ? '출원 권장' : '검토 필요'}
                </Badge>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">출원 전 안내사항</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>출원 비용은 담당자 확인 후 별도 안내됩니다</li>
                    <li>출원 접수 후 심사 기간은 통상 12-18개월입니다</li>
                    <li>본 분석 결과는 예측이며, 실제 심사 결과와 다를 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 출원자 정보 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 출원자명 */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    출원자명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="개인 또는 법인명을 입력하세요"
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* 전화번호 */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    전화번호 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="010-1234-5678"
                    className={errors.phone ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 주소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* 주소 */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="서울특별시 강남구 테헤란로 123, 4층"
                  className={errors.address ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      처리중...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      출원 신청
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}