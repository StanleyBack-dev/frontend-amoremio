const PURCHASE_ITEM_FIELDS = `
  idPurchaseItem
  idProduct
  productName
  purchasedQuantity
  purchasedUnit
  conversionFactor
  unitPrice
  lineTotal
  baseQuantity
  effectiveUnitCost
`;

const PURCHASE_FIELDS = `
  idPurchase
  idStore
  supplierName
  purchaseDate
  status
  freightAmount
  discountAmount
  discountMode
  discountPercent
  itemsSubtotal
  total
  notes
  createdByUserId
  createdByUserName
  finalizedAt
  createdAt
  updatedAt
  items {
    ${PURCHASE_ITEM_FIELDS}
  }
`;

export const GET_PURCHASE_FILTER_OPTIONS_QUERY = `
  query GetStorePurchaseFilterOptions($input: GetPurchaseFilterOptionsInputDto!) {
    getStorePurchaseFilterOptions(input: $input) {
      suppliers
      creators {
        id
        name
      }
    }
  }
`;

export const GET_STORE_PURCHASES_QUERY = `
  query GetStorePurchases($input: ListPurchasesInputDto!) {
    getStorePurchases(input: $input) {
      items {
        ${PURCHASE_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_PURCHASE_BY_ID_QUERY = `
  query GetPurchaseById($input: PurchaseScopeInputDto!) {
    getPurchaseById(input: $input) {
      ${PURCHASE_FIELDS}
    }
  }
`;

const mutation = (name, type, arg) => `
  mutation ${name}($input: ${arg}!) {
    ${type}(input: $input) {
      data {
        ${PURCHASE_FIELDS}
      }
    }
  }
`;

export const CREATE_PURCHASE_DRAFT_MUTATION = mutation(
  "CreatePurchaseDraft",
  "createPurchaseDraft",
  "CreatePurchaseDraftInputDto",
);
export const UPDATE_PURCHASE_HEADER_MUTATION = mutation(
  "UpdatePurchaseHeader",
  "updatePurchaseHeader",
  "UpdatePurchaseHeaderInputDto",
);
export const ADD_PURCHASE_ITEM_MUTATION = mutation(
  "AddPurchaseItem",
  "addPurchaseItem",
  "AddPurchaseItemInputDto",
);
export const UPDATE_PURCHASE_ITEM_MUTATION = mutation(
  "UpdatePurchaseItem",
  "updatePurchaseItem",
  "UpdatePurchaseItemInputDto",
);
export const REMOVE_PURCHASE_ITEM_MUTATION = mutation(
  "RemovePurchaseItem",
  "removePurchaseItem",
  "RemovePurchaseItemInputDto",
);
export const FINALIZE_PURCHASE_MUTATION = mutation(
  "FinalizePurchase",
  "finalizePurchase",
  "PurchaseScopeInputDto",
);
export const CANCEL_PURCHASE_MUTATION = mutation(
  "CancelPurchase",
  "cancelPurchase",
  "PurchaseScopeInputDto",
);
