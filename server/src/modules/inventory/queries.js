const STOCK_ITEM_FIELDS = `
  idProduct
  idStore
  productName
  sku
  brand
  kind
  status
  unit
  quantityOnHand
  averageCost
  stockValue
  reorderPoint
  updatedAt
`;

const STOCK_MOVEMENT_FIELDS = `
  idStockMovement
  idStore
  idProduct
  productName
  unit
  type
  quantity
  unitCost
  resultingQuantity
  resultingAverageCost
  sourceType
  sourceId
  note
  occurredAt
`;

const PAGINATION_FIELDS = `
  total
  currentPage
  limit
  totalPages
  hasNextPage
`;

export const GET_STORE_STOCK_QUERY = `
  query GetStoreStock($input: ListStoreStockInputDto!) {
    getStoreStock(input: $input) {
      items {
        ${STOCK_ITEM_FIELDS}
      }
      ${PAGINATION_FIELDS}
      stockValueTotal
    }
  }
`;

export const GET_STOCK_MOVEMENTS_QUERY = `
  query GetStockMovements($input: ListStockMovementsInputDto!) {
    getStockMovements(input: $input) {
      items {
        ${STOCK_MOVEMENT_FIELDS}
      }
      ${PAGINATION_FIELDS}
    }
  }
`;

export const ADJUST_STOCK_MUTATION = `
  mutation AdjustStock($input: AdjustStockInputDto!) {
    adjustStock(input: $input) {
      success
      message
      code
    }
  }
`;
