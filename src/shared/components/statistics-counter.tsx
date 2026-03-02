"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface StatisticItemProps {
  icon?: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
}

export function StatisticItem({ 
  icon: Icon, 
  value, 
  suffix = "", 
  label, 
  duration = 2000 
}: StatisticItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = value / (duration / 50);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <div className="text-center group">
      {Icon && (
        <div className="mb-3 w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-brand-600" />
        </div>
      )}
      <div className="text-3xl sm:text-4xl font-bold text-gray-900">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-neutral-600 mt-1">{label}</div>
    </div>
  );
}

interface StatisticsGridProps {
  statistics: Array<{
    icon?: LucideIcon;
    value: number;
    suffix?: string;
    label: string;
  }>;
  className?: string;
}

export function StatisticsGrid({ statistics, className = "" }: StatisticsGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-8 ${className}`}>
      {statistics.map((stat, index) => (
        <StatisticItem
          key={index}
          icon={stat.icon}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
        />
      ))}
    </div>
  );
}