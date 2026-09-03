import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  addPurchaseItem,
  cancelPurchase,
  createPurchaseDraft,
  finalizePurchase,
  getPurchaseById,
  listPurchaseFilterOptions,
  listPurchases,
  removePurchaseItem,
  updatePurchaseHeader,
  updatePurchaseItem,
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
    listPurchases(
      {
        idStore: req.query.idStore,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status || undefined,
        supplierName: req.query.supplierName || undefined,
        createdByUserId: req.query.createdByUserId || undefined,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.get(
  "/filter-options",
  handle((req) =>
    listPurchaseFilterOptions(
      { idStore: req.query.idStore },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/",
  handle((req) =>
    createPurchaseDraft(
      {
        idStore: req.body?.idStore,
        supplierName: req.body?.supplierName,
        purchaseDate: req.body?.purchaseDate,
        notes: req.body?.notes,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.get(
  "/:idPurchase",
  handle((req) =>
    getPurchaseById(
      { idStore: req.query.idStore, idPurchase: req.params.idPurchase },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.patch(
  "/:idPurchase/header",
  handle((req) =>
    updatePurchaseHeader(
      { ...req.body, idPurchase: req.params.idPurchase },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idPurchase/items",
  handle((req) =>
    addPurchaseItem(
      { ...req.body, idPurchase: req.params.idPurchase },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.patch(
  "/:idPurchase/items/:idPurchaseItem",
  handle((req) =>
    updatePurchaseItem(
      {
        ...req.body,
        idPurchase: req.params.idPurchase,
        idPurchaseItem: req.params.idPurchaseItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.delete(
  "/:idPurchase/items/:idPurchaseItem",
  handle((req) =>
    removePurchaseItem(
      {
        idStore: req.query.idStore,
        idPurchase: req.params.idPurchase,
        idPurchaseItem: req.params.idPurchaseItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idPurchase/finalize",
  handle((req) =>
    finalizePurchase(
      { idStore: req.body?.idStore, idPurchase: req.params.idPurchase },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idPurchase/cancel",
  handle((req) =>
    cancelPurchase(
      { idStore: req.body?.idStore, idPurchase: req.params.idPurchase },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

export default router;
