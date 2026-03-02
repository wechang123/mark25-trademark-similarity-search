/**
 * 전문가 상담 예약 모달 컴포넌트
 * 
 * 상담 선호사항을 입력받아 전문가 상담 예약을 처리하는 모달
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Phone, Video, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';

interface ConsultationPreferences {
  preferredDate?: string;
  preferredTime?: string;
  contactMethod: 'phone' | 'email' | 'video';
  urgency: 'low' | 'medium' | 'high';
  additionalQuestions?: string;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preferences: ConsultationPreferences) => Promise<void>;
  trademarkName: string;
  registrationProbability: number;
  isLoading?: boolean;
}

export function ConsultationModal({
  isOpen,
  onClose,
  onSubmit,
  trademarkName,
  registrationProbability,
  isLoading = false
}: ConsultationModalProps) {
  
  const [formData, setFormData] = useState<ConsultationPreferences>({
    preferredDate: '',
    preferredTime: '',
    contactMethod: 'phone',
    urgency: 'medium',
    additionalQuestions: ''
  });

  const [errors, setErrors] = useState<Partial<ConsultationPreferences>>({});

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Partial<ConsultationPreferences> = {};

    // 선호 날짜가 있으면 과거 날짜가 아닌지 확인
    if (formData.preferredDate) {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.preferredDate = '과거 날짜는 선택할 수 없습니다';
      }
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
      console.error('상담 예약 중 오류:', error);
    }
  };

  // 입력 필드 변경 처리
  const handleInputChange = (field: keyof ConsultationPreferences, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 연락 방법 아이콘 매핑
  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  // 긴급도 색상 매핑
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
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
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    전문가 상담 예약
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    10년차 변리사와의 1:1 상담을 예약하세요
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
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-indigo-900">
                    상담 대상: {trademarkName}
                  </h4>
                  <p className="text-sm text-indigo-700">
                    등록 가능성: {registrationProbability}%
                  </p>
                </div>
                <Badge 
                  variant={registrationProbability >= 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {registrationProbability >= 70 ? '상담 권장' : '정밀 검토 필요'}
                </Badge>
              </div>
            </div>

            {/* 상담 예약 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 상담 일정 선호사항 */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    📅 상담 일정 선호사항 (선택사항)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 선호 날짜 */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">선호 날짜</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.preferredDate ? 'border-red-500' : ''}
                        disabled={isLoading}
                      />
                      {errors.preferredDate && (
                        <p className="text-sm text-red-600">{errors.preferredDate}</p>
                      )}
                    </div>

                    {/* 선호 시간대 */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">선호 시간대</Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(value) => handleInputChange('preferredTime', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="시간대를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">오전 (09:00 - 12:00)</SelectItem>
                          <SelectItem value="afternoon">오후 (13:00 - 17:00)</SelectItem>
                          <SelectItem value="evening">저녁 (18:00 - 20:00)</SelectItem>
                          <SelectItem value="flexible">시간 무관</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 연락 방법 */}
              <div className="space-y-3">
                <Label>📞 선호하는 상담 방식 <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={formData.contactMethod}
                  onValueChange={(value: 'phone' | 'email' | 'video') => 
                    handleInputChange('contactMethod', value)
                  }
                  disabled={isLoading}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="flex items-center space-x-2 cursor-pointer">
                      <Phone className="w-4 h-4" />
                      <span>전화 상담</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center space-x-2 cursor-pointer">
                      <Video className="w-4 h-4" />
                      <span>화상 상담 (Zoom, Google Meet)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      <span>이메일 상담</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 긴급도 */}
              <div className="space-y-3">
                <Label>⚡ 상담 긴급도 <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    handleInputChange('urgency', value)
                  }
                  disabled={isLoading}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="cursor-pointer">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor('high')}`}>
                        긴급 (24시간 이내)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor('medium')}`}>
                        보통 (2-3일 이내)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="cursor-pointer">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor('low')}`}>
                        여유 (1주일 이내)
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 추가 질문사항 */}
              <div className="space-y-2">
                <Label htmlFor="additionalQuestions">
                  💬 추가 질문사항이나 상담 받고 싶은 내용 (선택사항)
                </Label>
                <Textarea
                  id="additionalQuestions"
                  value={formData.additionalQuestions}
                  onChange={(e) => handleInputChange('additionalQuestions', e.target.value)}
                  placeholder="예: 출원 비용이 궁금합니다, 유사한 상표가 있는지 자세히 알고 싶어요..."
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
              </div>

              {/* 상담 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">📋 상담 안내사항</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>상담 시간은 약 30-60분이며, 무료로 제공됩니다</li>
                    <li>10년차 변리사가 직접 상담을 진행합니다</li>
                    <li>상담 후 출원 진행 여부를 결정하실 수 있습니다</li>
                    <li>예약 확정 후 담당자가 연락드려 일정을 조율합니다</li>
                  </ul>
                </div>
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
                      예약 중...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      상담 예약
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