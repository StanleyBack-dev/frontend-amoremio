const RECIPE_ITEM_FIELDS = `
  idRecipeItem
  idProduct
  productName
  quantity
  unit
`;

const RECIPE_FIELDS = `
  idRecipe
  idStore
  idOutputProduct
  outputProductName
  name
  yieldQuantity
  yieldUnit
  laborCost
  overheadCost
  status
  notes
  createdByUserId
  createdByUserName
  createdAt
  updatedAt
  items {
    ${RECIPE_ITEM_FIELDS}
  }
`;

const PRODUCTION_ORDER_ITEM_FIELDS = `
  idProductionOrderItem
  idProduct
  productName
  quantity
  unit
  unitCostAtConsumption
  lineCost
`;

const PRODUCTION_ORDER_FIELDS = `
  idProductionOrder
  idStore
  idRecipe
  recipeName
  idOutputProduct
  outputProductName
  productionDate
  status
  batches
  plannedOutputQuantity
  actualOutputQuantity
  laborCost
  overheadCost
  inputsCost
  totalCost
  outputUnitCost
  notes
  createdByUserId
  createdByUserName
  concludedAt
  createdAt
  updatedAt
  items {
    ${PRODUCTION_ORDER_ITEM_FIELDS}
  }
`;

export const GET_STORE_RECIPES_QUERY = `
  query GetStoreRecipes($input: ListRecipesInputDto!) {
    getStoreRecipes(input: $input) {
      items {
        ${RECIPE_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_RECIPE_BY_ID_QUERY = `
  query GetRecipeById($input: RecipeScopeInputDto!) {
    getRecipeById(input: $input) {
      ${RECIPE_FIELDS}
    }
  }
`;

export const GET_STORE_PRODUCTION_ORDERS_QUERY = `
  query GetStoreProductionOrders($input: ListProductionOrdersInputDto!) {
    getStoreProductionOrders(input: $input) {
      items {
        ${PRODUCTION_ORDER_FIELDS}
      }
      total
      currentPage
      limit
      totalPages
      hasNextPage
    }
  }
`;

export const GET_PRODUCTION_ORDER_BY_ID_QUERY = `
  query GetProductionOrderById($input: ProductionOrderScopeInputDto!) {
    getProductionOrderById(input: $input) {
      ${PRODUCTION_ORDER_FIELDS}
    }
  }
`;

export const GET_PRODUCTION_ORDER_FILTER_OPTIONS_QUERY = `
  query GetStoreProductionOrderFilterOptions($input: GetProductionOrderFilterOptionsInputDto!) {
    getStoreProductionOrderFilterOptions(input: $input) {
      recipes {
        id
        name
      }
      creators {
        id
        name
      }
    }
  }
`;

const recipeMutation = (name, type, arg) => `
  mutation ${name}($input: ${arg}!) {
    ${type}(input: $input) {
      data {
        ${RECIPE_FIELDS}
      }
    }
  }
`;

const orderMutation = (name, type, arg) => `
  mutation ${name}($input: ${arg}!) {
    ${type}(input: $input) {
      data {
        ${PRODUCTION_ORDER_FIELDS}
      }
    }
  }
`;

export const CREATE_RECIPE_MUTATION = recipeMutation(
  "CreateRecipe",
  "createRecipe",
  "CreateRecipeInputDto",
);
export const UPDATE_RECIPE_MUTATION = recipeMutation(
  "UpdateRecipe",
  "updateRecipe",
  "UpdateRecipeInputDto",
);
export const ADD_RECIPE_ITEM_MUTATION = recipeMutation(
  "AddRecipeItem",
  "addRecipeItem",
  "AddRecipeItemInputDto",
);
export const ADD_RECIPE_ITEMS_MUTATION = recipeMutation(
  "AddRecipeItems",
  "addRecipeItems",
  "AddRecipeItemsInputDto",
);
export const UPDATE_RECIPE_ITEM_MUTATION = recipeMutation(
  "UpdateRecipeItem",
  "updateRecipeItem",
  "UpdateRecipeItemInputDto",
);
export const REMOVE_RECIPE_ITEM_MUTATION = recipeMutation(
  "RemoveRecipeItem",
  "removeRecipeItem",
  "RemoveRecipeItemInputDto",
);

export const CREATE_PRODUCTION_ORDER_MUTATION = orderMutation(
  "CreateProductionOrder",
  "createProductionOrder",
  "CreateProductionOrderInputDto",
);
export const UPDATE_PRODUCTION_ORDER_MUTATION = orderMutation(
  "UpdateProductionOrder",
  "updateProductionOrder",
  "UpdateProductionOrderInputDto",
);
export const COMPLETE_PRODUCTION_ORDER_MUTATION = orderMutation(
  "CompleteProductionOrder",
  "completeProductionOrder",
  "ProductionOrderScopeInputDto",
);
export const CANCEL_PRODUCTION_ORDER_MUTATION = orderMutation(
  "CancelProductionOrder",
  "cancelProductionOrder",
  "ProductionOrderScopeInputDto",
);
