import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  addRecipeItem,
  addRecipeItems,
  cancelProductionOrder,
  completeProductionOrder,
  createProductionOrder,
  createRecipe,
  getProductionOrderById,
  getRecipeById,
  listProductionOrderFilterOptions,
  listProductionOrders,
  listRecipes,
  removeRecipeItem,
  updateProductionOrder,
  updateRecipe,
  updateRecipeItem,
} from "./service.js";

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (error) {
    sendError(res, error);
  }
};

function parseBool(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

// --- Recipes -----------------------------------------------------------

export const recipesRouter = Router();

recipesRouter.get(
  "/",
  handle((req) =>
    listRecipes(
      {
        idStore: req.query.idStore,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: parseBool(req.query.status),
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.post(
  "/",
  handle((req) =>
    createRecipe(req.body, getAuthContext(req), req.requestId),
  ),
);

recipesRouter.get(
  "/:idRecipe",
  handle((req) =>
    getRecipeById(
      { idStore: req.query.idStore, idRecipe: req.params.idRecipe },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.patch(
  "/:idRecipe",
  handle((req) =>
    updateRecipe(
      { ...req.body, idRecipe: req.params.idRecipe },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.post(
  "/:idRecipe/items",
  handle((req) =>
    addRecipeItem(
      { ...req.body, idRecipe: req.params.idRecipe },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.post(
  "/:idRecipe/items/bulk",
  handle((req) =>
    addRecipeItems(
      { ...req.body, idRecipe: req.params.idRecipe },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.patch(
  "/:idRecipe/items/:idRecipeItem",
  handle((req) =>
    updateRecipeItem(
      {
        ...req.body,
        idRecipe: req.params.idRecipe,
        idRecipeItem: req.params.idRecipeItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

recipesRouter.delete(
  "/:idRecipe/items/:idRecipeItem",
  handle((req) =>
    removeRecipeItem(
      {
        idStore: req.query.idStore,
        idRecipe: req.params.idRecipe,
        idRecipeItem: req.params.idRecipeItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

// --- Production orders -----------------------------------------------

export const productionOrdersRouter = Router();

productionOrdersRouter.get(
  "/",
  handle((req) =>
    listProductionOrders(
      {
        idStore: req.query.idStore,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status || undefined,
        idRecipe: req.query.idRecipe || undefined,
        createdByUserId: req.query.createdByUserId || undefined,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

productionOrdersRouter.get(
  "/filter-options",
  handle((req) =>
    listProductionOrderFilterOptions(
      { idStore: req.query.idStore },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

productionOrdersRouter.post(
  "/",
  handle((req) =>
    createProductionOrder(req.body, getAuthContext(req), req.requestId),
  ),
);

productionOrdersRouter.get(
  "/:idProductionOrder",
  handle((req) =>
    getProductionOrderById(
      {
        idStore: req.query.idStore,
        idProductionOrder: req.params.idProductionOrder,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

productionOrdersRouter.patch(
  "/:idProductionOrder",
  handle((req) =>
    updateProductionOrder(
      { ...req.body, idProductionOrder: req.params.idProductionOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

productionOrdersRouter.post(
  "/:idProductionOrder/complete",
  handle((req) =>
    completeProductionOrder(
      {
        idStore: req.body?.idStore,
        idProductionOrder: req.params.idProductionOrder,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

productionOrdersRouter.post(
  "/:idProductionOrder/cancel",
  handle((req) =>
    cancelProductionOrder(
      {
        idStore: req.body?.idStore,
        idProductionOrder: req.params.idProductionOrder,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);
