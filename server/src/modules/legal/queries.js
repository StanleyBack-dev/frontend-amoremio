export const MY_TERMS_ACCEPTANCE_STATUS_QUERY = `
  query MyTermsAcceptanceStatus {
    myTermsAcceptanceStatus {
      accepted
      acceptedAt
      termsVersion
    }
  }
`;

export const ACCEPT_TERMS_OF_USE_MUTATION = `
  mutation AcceptTermsOfUse {
    acceptTermsOfUse {
      success
      message
    }
  }
`;
