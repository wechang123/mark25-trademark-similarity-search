"use client";

import { useState } from "react";
import { Search, Type, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export type TrademarkType = "text" | "combined";

interface QuickSearchBarProps {
  onSubmit: (data: {
    type: TrademarkType;
    name: string;
  }) => void;
  className?: string;
}

export function QuickSearchBar({ onSubmit, className = "" }: QuickSearchBarProps) {
  const [trademarkType, setTrademarkType] = useState<TrademarkType>("text");
  const [trademarkName, setTrademarkName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trademarkName.trim()) {
      onSubmit({
        type: trademarkType,
        name: trademarkName,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-2xl shadow-lg border border-neutral-100">
        {/* Type Selector */}
        <Select value={trademarkType} onValueChange={(value) => setTrademarkType(value as TrademarkType)}>
          <SelectTrigger className="w-full sm:w-40 h-12 border-neutral-200 rounded-xl">
            <div className="flex items-center gap-2">
              {trademarkType === "text" ? (
                <Type className="w-4 h-4 text-brand-500" />
              ) : (
                <Layers className="w-4 h-4 text-purple-500" />
              )}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>문자 상표</span>
              </div>
            </SelectItem>
            <SelectItem value="combined">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>결합 상표</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Input
            type="text"
            value={trademarkName}
            onChange={(e) => setTrademarkName(e.target.value)}
            placeholder={
              trademarkType === "text"
                ? "상표명을 입력하세요 (예: 삼성, SAMSUNG)"
                : "상표명을 입력하세요 (예: 스타벅스, 나이키)"
            }
            className="h-12 pr-4 pl-4 text-base border-0 focus:ring-0 rounded-xl"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="h-12 px-8 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          disabled={!trademarkName.trim()}
        >
          <Search className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">분석 시작</span>
          <span className="sm:hidden">검색</span>
        </Button>
      </div>

      {/* Helper Text */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500">
        <span>✨ AI가 자동으로 카테고리를 분류합니다</span>
        <span>🔍 유사 상표를 즉시 확인합니다</span>
        <span>📊 등록 가능성을 분석합니다</span>
      </div>
    </form>
  );
}