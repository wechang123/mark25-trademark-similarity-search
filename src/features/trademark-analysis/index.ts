// Components
export * from './_components'

// Hooks - currently no hooks exported
// export * from './_hooks'

// Services
export * from './_services'

// Types - export only available types from simplified-types
export type {
  // Simplified types for results
  SimplifiedAnalysisResult,
  SimplifiedResultData,
  Stage1Data,
  Stage2Data,
  Stage3Data,
  AnalysisCriterion,
  SimplifiedResultsViewProps,
  Stage3ActionResult,
  ApplicantInfo,
  ConsultationPreferences,
  // Legacy type for backward compatibility
  TrademarkAnalysisResult
} from './_types'

// Legacy components removed - using simplified flow