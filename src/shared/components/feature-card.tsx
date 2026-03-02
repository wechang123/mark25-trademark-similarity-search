"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
  className?: string;
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  highlight,
  className = "" 
}: FeatureCardProps) {
  return (
    <Card className={`group relative overflow-hidden border-neutral-200 hover:border-brand-300 hover:shadow-xl transition-all duration-300 ${className}`}>
      {/* Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-4">
        <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-brand-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          {title}
        </CardTitle>
        {highlight && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
              {highlight}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <CardDescription className="text-neutral-600 leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

interface FeatureGridProps {
  features: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    highlight?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({ features, columns = 3, className = "" }: FeatureGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          highlight={feature.highlight}
        />
      ))}
    </div>
  );
}