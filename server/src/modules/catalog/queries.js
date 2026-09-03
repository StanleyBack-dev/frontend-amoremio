const PRODUCT_FIELDS = `
  idProduct
  idStore
  name
  sku
  description
  brand
  kind
  unit
  packagingUnit
  packSize
  salePrice
  status
  createdByUserId
  createdByUserName
  createdAt
  updatedAt
`;

export const GET_STORE_PRODUCTS_QUERY = `
  query GetStoreProducts($input: ListProductsInputDto!) {
    getStoreProducts(input: $input) {
      items {
        ${PRODUCT_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_PRODUCT_BY_ID_QUERY = `
  query GetProductById($input: GetProductByIdInputDto!) {
    getProductById(input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const GET_PRODUCT_FILTER_OPTIONS_QUERY = `
  query GetStoreProductFilterOptions($input: GetProductFilterOptionsInputDto!) {
    getStoreProductFilterOptions(input: $input) {
      names
      brands
      creators {
        id
        name
      }
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: CreateProductInputDto!) {
    createProduct(input: $input) {
      data {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($input: UpdateProductInputDto!) {
    updateProduct(input: $input) {
      data {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;
