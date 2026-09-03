const SUPPLIER_FIELDS = `
  idSupplier
  idStore
  name
  phone
  email
  address
  instagram
  document
  notes
  status
  createdByUserId
  createdByUserName
  createdAt
  updatedAt
`;

export const GET_SUPPLIER_FILTER_OPTIONS_QUERY = `
  query GetStoreSupplierFilterOptions($input: GetSupplierFilterOptionsInputDto!) {
    getStoreSupplierFilterOptions(input: $input) {
      names
      creators {
        id
        name
      }
    }
  }
`;

export const GET_STORE_SUPPLIERS_QUERY = `
  query GetStoreSuppliers($input: ListSuppliersInputDto!) {
    getStoreSuppliers(input: $input) {
      items {
        ${SUPPLIER_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_SUPPLIER_BY_ID_QUERY = `
  query GetSupplierById($input: GetSupplierByIdInputDto!) {
    getSupplierById(input: $input) {
      ${SUPPLIER_FIELDS}
    }
  }
`;

export const CREATE_SUPPLIER_MUTATION = `
  mutation CreateSupplier($input: CreateSupplierInputDto!) {
    createSupplier(input: $input) {
      data {
        ${SUPPLIER_FIELDS}
      }
    }
  }
`;

export const UPDATE_SUPPLIER_MUTATION = `
  mutation UpdateSupplier($input: UpdateSupplierInputDto!) {
    updateSupplier(input: $input) {
      data {
        ${SUPPLIER_FIELDS}
      }
    }
  }
`;
