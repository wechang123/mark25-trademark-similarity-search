/**
 * Analytics & Dashboard API Schemas
 * 
 * Zod schemas for analytics, statistics, and dashboard APIs
 */

import { z } from 'zod';

/**
 * Search Analytics Schemas
 */
export const SearchAnalyticsRequestSchema = z.object({
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD')
  }),
  metrics: z.array(z.enum([
    'search_count',
    'unique_users',
    'success_rate',
    'avg_response_time',
    'popular_keywords',
    'classification_usage'
  ])).default(['search_count', 'unique_users']),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  filters: z.object({
    userId: z.string().optional(),
    searchType: z.enum(['similar', 'exact', 'contains', 'image']).optional(),
    classificationCodes: z.array(z.string()).optional(),
    hasResults: z.boolean().optional()
  }).optional()
});

export const SearchAnalyticsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: z.object({
      totalSearches: z.number(),
      uniqueUsers: z.number(),
      averageResponseTime: z.number(),
      successRate: z.number().min(0).max(1),
      periodComparison: z.object({
        searchesChange: z.number(),
        usersChange: z.number(),
        responseTimeChange: z.number()
      }).optional()
    }),
    timeSeries: z.array(z.object({
      timestamp: z.string(),
      searchCount: z.number(),
      uniqueUsers: z.number(),
      avgResponseTime: z.number(),
      successRate: z.number()
    })),
    topKeywords: z.array(z.object({
      keyword: z.string(),
      count: z.number(),
      successRate: z.number(),
      avgResponseTime: z.number()
    })),
    classificationUsage: z.array(z.object({
      code: z.string(),
      title: z.string(),
      count: z.number(),
      percentage: z.number()
    })),
    userSegmentation: z.object({
      newUsers: z.number(),
      returningUsers: z.number(),
      premiumUsers: z.number(),
      freeUsers: z.number()
    }).optional(),
    generatedAt: z.string().datetime()
  })
});

/**
 * User Activity Analytics
 */
export const UserActivityRequestSchema = z.object({
  userId: z.string().optional(),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  activityTypes: z.array(z.enum([
    'search',
    'analysis',
    'application',
    'bookmark',
    'export',
    'chat'
  ])).optional(),
  includeDetails: z.boolean().default(false)
});

export const UserActivityResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    userId: z.string().optional(),
    summary: z.object({
      totalActivities: z.number(),
      uniqueDays: z.number(),
      mostActiveHour: z.number(),
      averageSessionDuration: z.number(),
      lastActivity: z.string().datetime()
    }),
    activityBreakdown: z.array(z.object({
      type: z.string(),
      count: z.number(),
      percentage: z.number(),
      trend: z.enum(['up', 'down', 'stable']).optional()
    })),
    timeline: z.array(z.object({
      date: z.string(),
      activities: z.array(z.object({
        type: z.string(),
        timestamp: z.string().datetime(),
        details: z.record(z.any()).optional()
      })).optional()
    })),
    insights: z.array(z.object({
      type: z.enum(['usage_pattern', 'preference', 'recommendation']),
      title: z.string(),
      description: z.string(),
      confidence: z.number().min(0).max(100)
    }))
  })
});

/**
 * System Performance Analytics
 */
export const PerformanceMetricsRequestSchema = z.object({
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  services: z.array(z.enum([
    'api_gateway',
    'search_service', 
    'analysis_service',
    'ai_service',
    'database',
    'cache',
    'file_storage'
  ])).optional(),
  metrics: z.array(z.enum([
    'response_time',
    'error_rate',
    'throughput',
    'cpu_usage',
    'memory_usage',
    'disk_usage',
    'cache_hit_rate'
  ])).default(['response_time', 'error_rate', 'throughput'])
});

export const PerformanceMetricsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    overview: z.object({
      systemHealth: z.enum(['healthy', 'warning', 'critical']),
      uptime: z.number(),
      totalRequests: z.number(),
      errorRate: z.number(),
      avgResponseTime: z.number()
    }),
    services: z.array(z.object({
      name: z.string(),
      status: z.enum(['online', 'degraded', 'offline']),
      responseTime: z.object({
        current: z.number(),
        average: z.number(),
        p95: z.number(),
        p99: z.number()
      }),
      errorRate: z.number(),
      throughput: z.number(),
      lastCheck: z.string().datetime()
    })),
    timeSeries: z.array(z.object({
      timestamp: z.string().datetime(),
      responseTime: z.number(),
      errorRate: z.number(),
      throughput: z.number(),
      cpuUsage: z.number().optional(),
      memoryUsage: z.number().optional()
    })),
    alerts: z.array(z.object({
      level: z.enum(['info', 'warning', 'error', 'critical']),
      service: z.string(),
      message: z.string(),
      timestamp: z.string().datetime(),
      resolved: z.boolean()
    }))
  })
});

/**
 * Business Intelligence Schemas
 */
export const BusinessInsightsRequestSchema = z.object({
  reportType: z.enum(['revenue', 'usage', 'user_acquisition', 'retention', 'conversion']),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  compareWithPrevious: z.boolean().default(true),
  segments: z.array(z.enum([
    'user_type',
    'subscription_plan',
    'geographic_region',
    'acquisition_channel',
    'device_type'
  ])).optional()
});

export const BusinessInsightsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    reportType: z.string(),
    period: z.object({
      startDate: z.string(),
      endDate: z.string(),
      granularity: z.string()
    }),
    kpis: z.array(z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      change: z.object({
        value: z.number(),
        percentage: z.number(),
        trend: z.enum(['up', 'down', 'stable'])
      }).optional(),
      target: z.number().optional(),
      status: z.enum(['good', 'warning', 'critical']).optional()
    })),
    charts: z.array(z.object({
      type: z.enum(['line', 'bar', 'pie', 'area', 'funnel']),
      title: z.string(),
      data: z.array(z.record(z.any())),
      insights: z.array(z.string()).optional()
    })),
    segments: z.array(z.object({
      name: z.string(),
      data: z.array(z.object({
        label: z.string(),
        value: z.number(),
        percentage: z.number(),
        trend: z.enum(['up', 'down', 'stable']).optional()
      }))
    })),
    recommendations: z.array(z.object({
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string(),
      title: z.string(),
      description: z.string(),
      expectedImpact: z.string(),
      effort: z.enum(['low', 'medium', 'high'])
    }))
  })
});

/**
 * Export Analytics Request Schema
 */
export const ExportAnalyticsRequestSchema = z.object({
  reportType: z.enum(['search_analytics', 'user_activity', 'performance', 'business_insights']),
  format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  filters: z.record(z.any()).optional(),
  includeRawData: z.boolean().default(false),
  emailDelivery: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().email())
  }).optional()
});

export const ExportAnalyticsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    exportId: z.string(),
    downloadUrl: z.string().url(),
    format: z.string(),
    size: z.number(),
    expiresAt: z.string().datetime(),
    generatedAt: z.string().datetime(),
    metadata: z.object({
      recordCount: z.number(),
      dateRange: z.object({
        startDate: z.string(),
        endDate: z.string()
      }),
      appliedFilters: z.record(z.any()).optional()
    })
  })
});

/**
 * Real-time Dashboard Schema
 */
export const DashboardDataRequestSchema = z.object({
  widgets: z.array(z.enum([
    'active_users',
    'search_volume',
    'system_health',
    'revenue_today',
    'recent_activities',
    'error_rates',
    'popular_searches',
    'geographic_distribution'
  ])),
  refreshInterval: z.number().min(5).max(300).default(30).describe('초 단위 새로고침 간격')
});

export const DashboardDataResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    widgets: z.record(z.any()),
    lastUpdated: z.string().datetime(),
    nextUpdate: z.string().datetime()
  })
});

/**
 * Export all analytics schemas
 */
export const AnalyticsSchemas = {
  // Search Analytics
  SearchAnalyticsRequest: SearchAnalyticsRequestSchema,
  SearchAnalyticsResponse: SearchAnalyticsResponseSchema,
  
  // User Activity
  UserActivityRequest: UserActivityRequestSchema,
  UserActivityResponse: UserActivityResponseSchema,
  
  // Performance Metrics
  PerformanceMetricsRequest: PerformanceMetricsRequestSchema,
  PerformanceMetricsResponse: PerformanceMetricsResponseSchema,
  
  // Business Insights
  BusinessInsightsRequest: BusinessInsightsRequestSchema,
  BusinessInsightsResponse: BusinessInsightsResponseSchema,
  
  // Export
  ExportAnalyticsRequest: ExportAnalyticsRequestSchema,
  ExportAnalyticsResponse: ExportAnalyticsResponseSchema,
  
  // Dashboard
  DashboardDataRequest: DashboardDataRequestSchema,
  DashboardDataResponse: DashboardDataResponseSchema
};