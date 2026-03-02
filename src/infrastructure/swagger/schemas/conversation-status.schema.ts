import { z } from 'zod';

/**
 * Conversation Status API Schemas
 * For retrieving conversation status and session progress
 */

/**
 * GET Query Parameters Schema
 */
export const ConversationStatusQuerySchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required').describe('세션 ID')
});

/**
 * User Responses Schema
 */
export const UserResponsesSchema = z.object({
  businessDescription: z.string().describe('사업 설명')
});

/**
 * Conversation Status Data Schema
 */
export const ConversationStatusDataSchema = z.object({
  sessionId: z.string().describe('세션 ID'),
  businessDescription: z.string().describe('사업 설명'),
  userResponses: UserResponsesSchema.describe('사용자 응답 데이터'),
  conversationCount: z.number().describe('대화 수'),
  hasBusinessDescription: z.boolean().describe('사업 설명 보유 여부'),
  sessionStatus: z.string().optional().describe('세션 상태'),
  sessionProgress: z.number().describe('세션 진행률')
});

/**
 * Success Response Schema
 */
export const ConversationStatusSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ConversationStatusDataSchema
});

/**
 * Error Response Schema
 */
export const ConversationStatusErrorResponseSchema = z.object({
  error: z.string().describe('오류 메시지')
});

/**
 * Union Response Schema for all possible responses
 */
export const ConversationStatusResponseSchema = z.union([
  ConversationStatusSuccessResponseSchema,
  ConversationStatusErrorResponseSchema
]);

// Type exports
export type ConversationStatusQuery = z.infer<typeof ConversationStatusQuerySchema>;
export type UserResponses = z.infer<typeof UserResponsesSchema>;
export type ConversationStatusData = z.infer<typeof ConversationStatusDataSchema>;
export type ConversationStatusSuccessResponse = z.infer<typeof ConversationStatusSuccessResponseSchema>;
export type ConversationStatusErrorResponse = z.infer<typeof ConversationStatusErrorResponseSchema>;
export type ConversationStatusResponse = z.infer<typeof ConversationStatusResponseSchema>;