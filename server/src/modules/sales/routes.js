import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  addSalesOrderItem,
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  getSalesOrderById,
  listSalesOrderFilterOptions,
  listSalesOrders,
  removeSalesOrderItem,
  updateSalesOrderHeader,
  updateSalesOrderItem,
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
    listSalesOrders(
      {
        idStore: req.query.idStore,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status || undefined,
        customerName: req.query.customerName || undefined,
        salesChannel: req.query.salesChannel || undefined,
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
    listSalesOrderFilterOptions(
      { idStore: req.query.idStore },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/",
  handle((req) =>
    createSalesOrder(
      {
        idStore: req.body?.idStore,
        customerName: req.body?.customerName,
        orderDate: req.body?.orderDate,
        salesChannel: req.body?.salesChannel,
        notes: req.body?.notes,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.get(
  "/:idSalesOrder",
  handle((req) =>
    getSalesOrderById(
      { idStore: req.query.idStore, idSalesOrder: req.params.idSalesOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.patch(
  "/:idSalesOrder/header",
  handle((req) =>
    updateSalesOrderHeader(
      { ...req.body, idSalesOrder: req.params.idSalesOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idSalesOrder/items",
  handle((req) =>
    addSalesOrderItem(
      { ...req.body, idSalesOrder: req.params.idSalesOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.patch(
  "/:idSalesOrder/items/:idSalesOrderItem",
  handle((req) =>
    updateSalesOrderItem(
      {
        ...req.body,
        idSalesOrder: req.params.idSalesOrder,
        idSalesOrderItem: req.params.idSalesOrderItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.delete(
  "/:idSalesOrder/items/:idSalesOrderItem",
  handle((req) =>
    removeSalesOrderItem(
      {
        idStore: req.query.idStore,
        idSalesOrder: req.params.idSalesOrder,
        idSalesOrderItem: req.params.idSalesOrderItem,
      },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idSalesOrder/confirm",
  handle((req) =>
    confirmSalesOrder(
      { idStore: req.body?.idStore, idSalesOrder: req.params.idSalesOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

router.post(
  "/:idSalesOrder/cancel",
  handle((req) =>
    cancelSalesOrder(
      { idStore: req.body?.idStore, idSalesOrder: req.params.idSalesOrder },
      getAuthContext(req),
      req.requestId,
    ),
  ),
);

export default router;
