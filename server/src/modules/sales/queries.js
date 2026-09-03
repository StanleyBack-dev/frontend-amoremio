const ITEM_FIELDS = `
  idSalesOrderItem
  idProduct
  productName
  productKind
  quantity
  unitPrice
  lineTotal
`;

const ORDER_FIELDS = `
  idSalesOrder
  idStore
  customerName
  orderDate
  status
  salesChannel
  commissionPercent
  commissionAmount
  netTotal
  discountAmount
  discountMode
  discountPercent
  itemsSubtotal
  total
  notes
  createdByUserId
  createdByUserName
  confirmedAt
  createdAt
  updatedAt
  items {
    ${ITEM_FIELDS}
  }
`;

export const GET_STORE_SALES_ORDERS_QUERY = `
  query GetStoreSalesOrders($input: ListSalesOrdersInputDto!) {
    getStoreSalesOrders(input: $input) {
      items {
        ${ORDER_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_SALES_ORDER_FILTER_OPTIONS_QUERY = `
  query GetStoreSalesOrderFilterOptions(
    $input: GetSalesOrderFilterOptionsInputDto!
  ) {
    getStoreSalesOrderFilterOptions(input: $input) {
      customers
      channels
      creators {
        id
        name
      }
    }
  }
`;

export const GET_SALES_ORDER_BY_ID_QUERY = `
  query GetSalesOrderById($input: SalesOrderScopeInputDto!) {
    getSalesOrderById(input: $input) {
      ${ORDER_FIELDS}
    }
  }
`;

const mut = (name, type, arg) => `
  mutation ${name}($input: ${arg}!) {
    ${type}(input: $input) {
      data {
        ${ORDER_FIELDS}
      }
    }
  }
`;

export const CREATE_SALES_ORDER_MUTATION = mut(
  "CreateSalesOrder",
  "createSalesOrder",
  "CreateSalesOrderInputDto",
);
export const UPDATE_SALES_ORDER_HEADER_MUTATION = mut(
  "UpdateSalesOrderHeader",
  "updateSalesOrderHeader",
  "UpdateSalesOrderHeaderInputDto",
);
export const ADD_SALES_ORDER_ITEM_MUTATION = mut(
  "AddSalesOrderItem",
  "addSalesOrderItem",
  "AddSalesOrderItemInputDto",
);
export const UPDATE_SALES_ORDER_ITEM_MUTATION = mut(
  "UpdateSalesOrderItem",
  "updateSalesOrderItem",
  "UpdateSalesOrderItemInputDto",
);
export const REMOVE_SALES_ORDER_ITEM_MUTATION = mut(
  "RemoveSalesOrderItem",
  "removeSalesOrderItem",
  "RemoveSalesOrderItemInputDto",
);
export const CONFIRM_SALES_ORDER_MUTATION = mut(
  "ConfirmSalesOrder",
  "confirmSalesOrder",
  "SalesOrderScopeInputDto",
);
export const CANCEL_SALES_ORDER_MUTATION = mut(
  "CancelSalesOrder",
  "cancelSalesOrder",
  "SalesOrderScopeInputDto",
);
