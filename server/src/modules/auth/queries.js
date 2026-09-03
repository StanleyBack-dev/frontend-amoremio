const USER_FIELDS = `
  idUsers
  name
  email
  username
  group
  urlAvatar
  status
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInputDto!) {
    login(input: $input) {
      authenticated
      mustChangePassword
      onboardingTourCompleted
      termsAccepted
      isTermsReacceptance
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const REFRESH_SESSION_QUERY = `
  mutation RefreshAuthSession {
    refreshAuthSession {
      authenticated
      mustChangePassword
      onboardingTourCompleted
      termsAccepted
      isTermsReacceptance
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const MY_PAGE_PERMISSIONS_QUERY = `
  query MyPagePermissions {
    getMyPagePermissions {
      effectivePermissions
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = `
  mutation ChangeMyPassword($input: ChangePasswordInputDto!) {
    changeMyPassword(input: $input) {
      success
      message
    }
  }
`;

export const COMPLETE_ONBOARDING_TOUR_MUTATION = `
  mutation CompleteOnboardingTour {
    completeOnboardingTour {
      success
      message
    }
  }
`;

export const REQUEST_PASSWORD_RECOVERY_MUTATION = `
  mutation RequestPasswordRecovery($input: RequestPasswordRecoveryInputDto!) {
    requestPasswordRecovery(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_PASSWORD_RECOVERY_MUTATION = `
  mutation VerifyPasswordRecoveryCode($input: VerifyPasswordRecoveryCodeInputDto!) {
    verifyPasswordRecoveryCode(input: $input) {
      success
      message
      data {
        recoveryToken
        expiresAt
      }
    }
  }
`;

export const RESET_PASSWORD_RECOVERY_MUTATION = `
  mutation ResetPasswordWithRecovery($input: ResetPasswordWithRecoveryInputDto!) {
    resetPasswordWithRecovery(input: $input) {
      success
      message
    }
  }
`;
