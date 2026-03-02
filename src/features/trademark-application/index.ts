// Trademark Application feature public API exports

// Components (UI Layer)
export { TrademarkApplicationForm } from './_components/TrademarkApplicationForm'
export { TrademarkApplicationSuccess } from './_components/TrademarkApplicationSuccess'
export { SignaturePad } from './_components/SignaturePad'

// Pages (Next.js App Router)
export { default as TrademarkApplicationPage } from './pages/page'
export { default as TrademarkApplicationSuccessPage } from './pages/success/page'

// Services (Business Logic Layer)
export { submitTrademarkApplication } from './_services/api-client'

// Types (Type Definitions)
export type {
  TrademarkApplicationFormData,
  TrademarkApplicationResponse,
  AddressAutoChangeValue,
  SingleApplicationValue,
  ElectronicCertificateValue,
  PostcodeData,
  ServicePlan
} from './_types'