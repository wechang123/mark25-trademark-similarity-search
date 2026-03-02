
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Lightbulb, Type, Image as ImageIcon, Box, AlertCircle } from 'lucide-react';

type TrademarkType = 'text' | 'image' | 'combined';

const TrademarkTypeCard = ({
  type,
  title,
  description,
  icon,
  selected,
  onSelect,
}: {
  type: TrademarkType;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (type: TrademarkType) => void;
}) => (
  <Card
    className={`cursor-pointer transition-all duration-300 ${
      selected ? 'border-brand-500 ring-2 ring-brand-500 shadow-lg' : 'hover:shadow-md'
    }`}
    onClick={() => onSelect(type)}
  >
    <CardHeader className="flex flex-row items-start gap-4">
      <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">{icon}</div>
      <div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </div>
    </CardHeader>
  </Card>
);

export function TrademarkTypeSelection() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TrademarkType | null>(null);
  const [trademarkName, setTrademarkName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!trademarkName) {
      setError('상표명을 입력해주세요.');
      return;
    }
    if (!selectedType) {
      setError('상표 유형을 선택해주세요.');
      return;
    }
    
    const params = new URLSearchParams({
      trademark: trademarkName,
      hasImage: (selectedType === 'image' || selectedType === 'combined').toString(),
    });
    
    router.push(`/analysis?${params.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">상표 분석 시작하기</CardTitle>
          <CardDescription className="text-center">
            분석할 상표의 이름과 유형을 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="trademarkName" className="font-semibold">상표명</label>
            <Input
              id="trademarkName"
              placeholder="예: 마크업 (MarkUp)"
              value={trademarkName}
              onChange={(e) => {
                setTrademarkName(e.target.value);
                if (error) setError(null);
              }}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold">상표 유형</label>
            <div className="grid grid-cols-1 gap-4">
              <TrademarkTypeCard
                type="text"
                title="문자 상표"
                description="글자로만 이루어진 상표"
                icon={<Type className="w-6 h-6 text-brand-500" />}
                selected={selectedType === 'text'}
                onSelect={setSelectedType}
              />
              <TrademarkTypeCard
                type="image"
                title="도형 상표"
                description="그림, 로고, 아이콘 등"
                icon={<ImageIcon className="w-6 h-6 text-brand-500" />}
                selected={selectedType === 'image'}
                onSelect={setSelectedType}
              />
              <TrademarkTypeCard
                type="combined"
                title="결합 상표"
                description="문자와 도형이 함께 있는 상표"
                icon={<Box className="w-6 h-6 text-brand-500" />}
                selected={selectedType === 'combined'}
                onSelect={setSelectedType}
              />
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              정확한 유형을 선택하면 더 정확한 분석이 가능합니다.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleNext} className="w-full" size="lg" disabled={!trademarkName || !selectedType}>
            분석 시작
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
