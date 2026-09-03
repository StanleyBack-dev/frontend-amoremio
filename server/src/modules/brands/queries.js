const BRAND_FIELDS = `
  idBrand
  idStore
  name
  status
  createdByUserId
  createdByUserName
  createdAt
  updatedAt
`;

export const GET_BRAND_FILTER_OPTIONS_QUERY = `
  query GetStoreBrandFilterOptions($input: GetBrandFilterOptionsInputDto!) {
    getStoreBrandFilterOptions(input: $input) {
      names
      creators {
        id
        name
      }
    }
  }
`;

export const GET_STORE_BRANDS_QUERY = `
  query GetStoreBrands($input: ListBrandsInputDto!) {
    getStoreBrands(input: $input) {
      items {
        ${BRAND_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_BRAND_BY_ID_QUERY = `
  query GetBrandById($input: GetBrandByIdInputDto!) {
    getBrandById(input: $input) {
      ${BRAND_FIELDS}
    }
  }
`;

export const CREATE_BRAND_MUTATION = `
  mutation CreateBrand($input: CreateBrandInputDto!) {
    createBrand(input: $input) {
      data {
        ${BRAND_FIELDS}
      }
    }
  }
`;

export const UPDATE_BRAND_MUTATION = `
  mutation UpdateBrand($input: UpdateBrandInputDto!) {
    updateBrand(input: $input) {
      data {
        ${BRAND_FIELDS}
      }
    }
  }
`;
