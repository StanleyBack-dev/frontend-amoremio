const CUSTOMER_FIELDS = `
  idCustomer
  idStore
  name
  phone
  email
  address
  notes
  status
  createdByUserId
  createdByUserName
  createdAt
  updatedAt
`;

export const GET_CUSTOMER_FILTER_OPTIONS_QUERY = `
  query GetStoreCustomerFilterOptions($input: GetCustomerFilterOptionsInputDto!) {
    getStoreCustomerFilterOptions(input: $input) {
      names
      creators {
        id
        name
      }
    }
  }
`;

export const GET_STORE_CUSTOMERS_QUERY = `
  query GetStoreCustomers($input: ListCustomersInputDto!) {
    getStoreCustomers(input: $input) {
      items {
        ${CUSTOMER_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_CUSTOMER_BY_ID_QUERY = `
  query GetCustomerById($input: GetCustomerByIdInputDto!) {
    getCustomerById(input: $input) {
      ${CUSTOMER_FIELDS}
    }
  }
`;

export const CREATE_CUSTOMER_MUTATION = `
  mutation CreateCustomer($input: CreateCustomerInputDto!) {
    createCustomer(input: $input) {
      data {
        ${CUSTOMER_FIELDS}
      }
    }
  }
`;

export const UPDATE_CUSTOMER_MUTATION = `
  mutation UpdateCustomer($input: UpdateCustomerInputDto!) {
    updateCustomer(input: $input) {
      data {
        ${CUSTOMER_FIELDS}
      }
    }
  }
`;
