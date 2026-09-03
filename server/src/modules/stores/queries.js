const STORE_FIELDS = `
  idStore
  name
  legalName
  cnpj
  whatsapp
  email
  instagram
  ifoodUrl
  food99Url
  status
  role
  createdByUserId
  createdAt
  updatedAt
`;

const STORE_MEMBER_FIELDS = `
  idStoreMembership
  idStore
  idUsers
  name
  email
  username
  role
  createdAt
  updatedAt
`;

export const GET_MY_STORES_QUERY = `
  query GetMyStores {
    getMyStores {
      ${STORE_FIELDS}
    }
  }
`;

export const GET_STORE_BY_ID_QUERY = `
  query GetStoreById($input: GetStoreByIdInputDto!) {
    getStoreById(input: $input) {
      ${STORE_FIELDS}
    }
  }
`;

export const GET_STORE_MEMBERS_QUERY = `
  query GetStoreMembers($input: GetStoreByIdInputDto!) {
    getStoreMembers(input: $input) {
      ${STORE_MEMBER_FIELDS}
    }
  }
`;

export const CREATE_STORE_MUTATION = `
  mutation CreateStore($input: CreateStoreInputDto!) {
    createStore(input: $input) {
      data {
        ${STORE_FIELDS}
      }
    }
  }
`;

export const UPDATE_STORE_MUTATION = `
  mutation UpdateStore($input: UpdateStoreInputDto!) {
    updateStore(input: $input) {
      data {
        ${STORE_FIELDS}
      }
    }
  }
`;

export const ADD_STORE_MEMBER_MUTATION = `
  mutation AddStoreMember($input: AddStoreMemberInputDto!) {
    addStoreMember(input: $input) {
      ${STORE_MEMBER_FIELDS}
    }
  }
`;

export const UPDATE_STORE_MEMBER_ROLE_MUTATION = `
  mutation UpdateStoreMemberRole($input: UpdateStoreMemberRoleInputDto!) {
    updateStoreMemberRole(input: $input) {
      ${STORE_MEMBER_FIELDS}
    }
  }
`;

export const REMOVE_STORE_MEMBER_MUTATION = `
  mutation RemoveStoreMember($input: RemoveStoreMemberInputDto!) {
    removeStoreMember(input: $input) {
      ${STORE_MEMBER_FIELDS}
    }
  }
`;
