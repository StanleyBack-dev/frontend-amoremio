const SHOPPING_LIST_ITEM_FIELDS = `
  idShoppingListItem
  idProduct
  productName
  unit
  desiredQuantity
  note
  purchased
`;

const SHOPPING_LIST_FIELDS = `
  idShoppingList
  idStore
  name
  status
  notes
  convertedToPurchaseId
  createdByUserId
  createdByUserName
  convertedAt
  createdAt
  updatedAt
  items {
    ${SHOPPING_LIST_ITEM_FIELDS}
  }
`;

export const GET_STORE_SHOPPING_LISTS_QUERY = `
  query GetStoreShoppingLists($input: ListShoppingListsInputDto!) {
    getStoreShoppingLists(input: $input) {
      items {
        ${SHOPPING_LIST_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_SHOPPING_LIST_BY_ID_QUERY = `
  query GetShoppingListById($input: ShoppingListScopeInputDto!) {
    getShoppingListById(input: $input) {
      ${SHOPPING_LIST_FIELDS}
    }
  }
`;

export const GET_SHOPPING_LIST_BY_PURCHASE_ID_QUERY = `
  query GetShoppingListByPurchaseId($input: GetShoppingListByPurchaseIdInputDto!) {
    getShoppingListByPurchaseId(input: $input) {
      ${SHOPPING_LIST_FIELDS}
    }
  }
`;

const mutation = (name, type, arg) => `
  mutation ${name}($input: ${arg}!) {
    ${type}(input: $input) {
      data {
        ${SHOPPING_LIST_FIELDS}
      }
    }
  }
`;

export const CREATE_SHOPPING_LIST_MUTATION = mutation(
  "CreateShoppingList",
  "createShoppingList",
  "CreateShoppingListInputDto",
);
export const ADD_SHOPPING_LIST_ITEM_MUTATION = mutation(
  "AddShoppingListItem",
  "addShoppingListItem",
  "AddShoppingListItemInputDto",
);
export const ADD_SHOPPING_LIST_ITEMS_MUTATION = mutation(
  "AddShoppingListItems",
  "addShoppingListItems",
  "AddShoppingListItemsInputDto",
);
export const UPDATE_SHOPPING_LIST_ITEM_MUTATION = mutation(
  "UpdateShoppingListItem",
  "updateShoppingListItem",
  "UpdateShoppingListItemInputDto",
);
export const REMOVE_SHOPPING_LIST_ITEM_MUTATION = mutation(
  "RemoveShoppingListItem",
  "removeShoppingListItem",
  "RemoveShoppingListItemInputDto",
);
export const CANCEL_SHOPPING_LIST_MUTATION = mutation(
  "CancelShoppingList",
  "cancelShoppingList",
  "ShoppingListScopeInputDto",
);
export const CONVERT_SHOPPING_LIST_TO_PURCHASE_MUTATION = mutation(
  "ConvertShoppingListToPurchase",
  "convertShoppingListToPurchase",
  "ShoppingListScopeInputDto",
);
