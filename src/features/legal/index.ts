export {
  fetchMyTermsAcceptanceStatus,
  requestAcceptTermsOfUse,
} from "./services/legal.service";
export type { TermsAcceptanceStatus } from "../../api/legal/schema";
export {
  LEGAL_CONTENT_VERSION_LABEL,
  PRIVACY_POLICY_SECTIONS,
  TERMS_OF_USE_SECTIONS,
  type LegalSection,
} from "./content/legalContent";
