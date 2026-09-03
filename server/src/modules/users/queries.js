const USER_FIELDS = `
  idUsers
  name
  email
  username
  group
  urlAvatar
  status
  mustChangePassword
  lastLoginAt
  failedLoginAttempts
  lockedUntil
  inactivatedAt
  createdAt
  updatedAt
`;

const CREATE_USER_FIELDS = `
  idUsers
  name
  email
  username
  group
  urlAvatar
  status
  mustChangePassword
  createdAt
`;

export const ME_QUERY = `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
`;

export const GET_USERS_QUERY = `
  query GetUsers($input: GetUsersInputDto) {
    getUsers(input: $input) {
      items {
        ${USER_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInputDto!) {
    createUser(input: $input) {
      success
      message
      code
      data {
        ${CREATE_USER_FIELDS}
      }
    }
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = `
  mutation UpdateUser($input: UpdateUserInputDto!) {
    updateUser(input: $input) {
      success
      message
      code
      data {
        idUsers
        name
        email
        urlAvatar
        status
        updatedAt
      }
    }
  }
`;

export const ADMIN_UPDATE_USER_ACCESS_MUTATION = `
  mutation AdminUpdateUserAccess($input: AdminUpdateUserAccessInputDto!) {
    adminUpdateUserAccess(input: $input) {
      success
      message
      code
      data {
        idUsers
        group
        status
        inactivatedAt
        updatedAt
      }
    }
  }
`;

export const GET_USER_PAGE_PERMISSIONS_QUERY = `
  query GetUserPagePermissions($input: GetUserPagePermissionsInputDto!) {
    getUserPagePermissions(input: $input) {
      idUsers
      group
      effectivePermissions
      defaultPermissions
      useGroupDefaults
      updatedAt
    }
  }
`;

export const GET_USER_FILTER_OPTIONS_QUERY = `
  query GetUserFilterOptions {
    getUserFilterOptions {
      idUsers
      name
      email
      username
    }
  }
`;

export const UNLOCK_USER_CREDENTIAL_MUTATION = `
  mutation UnlockUserCredential($input: UnlockUserCredentialInputDto!) {
    unlockUserCredential(input: $input) {
      success
      message
      code
      data {
        idUsers
        updatedAt
      }
    }
  }
`;
