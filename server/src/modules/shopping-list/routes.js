import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  addShoppingListItem,
  addShoppingListItems,
  cancelShoppingList,
  convertShoppingListToPurchase,
  createShoppingList,
  getShoppingListById,
  getShoppingListByPurchaseId,
  listShoppingLists,
  removeShoppingListItem,
  updateShoppingListItem,
} from "./service.js";

const router = Router();

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

router.get(
  "/",
  handle((req) =>
    listShoppingLists(
      {
        idStore: req.query.idStore,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status || undefined,
        createdByUserId: req.query.createdByUserId || undefined,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/",
  handle((req) =>
    createShoppingList(
      {
        idStore: req.body?.idStore,
        name: req.body?.name,
        notes: req.body?.notes,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

// Registered before "/:idShoppingList" — otherwise Express would swallow
// "by-purchase" as that param.
router.get(
  "/by-purchase/:idPurchase",
  handle((req) =>
    getShoppingListByPurchaseId(
      {
        idStore: req.query.idStore,
        idPurchase: req.params.idPurchase,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.get(
  "/:idShoppingList",
  handle((req) =>
    getShoppingListById(
      {
        idStore: req.query.idStore,
        idShoppingList: req.params.idShoppingList,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idShoppingList/items",
  handle((req) =>
    addShoppingListItem(
      { ...req.body, idShoppingList: req.params.idShoppingList },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idShoppingList/items/bulk",
  handle((req) =>
    addShoppingListItems(
      { ...req.body, idShoppingList: req.params.idShoppingList },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.patch(
  "/:idShoppingList/items/:idShoppingListItem",
  handle((req) =>
    updateShoppingListItem(
      {
        ...req.body,
        idShoppingList: req.params.idShoppingList,
        idShoppingListItem: req.params.idShoppingListItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.delete(
  "/:idShoppingList/items/:idShoppingListItem",
  handle((req) =>
    removeShoppingListItem(
      {
        idStore: req.query.idStore,
        idShoppingList: req.params.idShoppingList,
        idShoppingListItem: req.params.idShoppingListItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idShoppingList/cancel",
  handle((req) =>
    cancelShoppingList(
      { idStore: req.body?.idStore, idShoppingList: req.params.idShoppingList },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idShoppingList/convert",
  handle((req) =>
    convertShoppingListToPurchase(
      { idStore: req.body?.idStore, idShoppingList: req.params.idShoppingList },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

export default router;
