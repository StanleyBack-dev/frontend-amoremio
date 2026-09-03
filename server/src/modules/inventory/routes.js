import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import { adjustStock, listStockMovements, listStoreStock } from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

function parseBool(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

router.get("/stock", async (req, res) => {
  try {
    res.json(
      await listStoreStock(
        {
          idStore: req.query.idStore,
          name: req.query.name || undefined,
          brand: req.query.brand || undefined,
          withoutBrand: parseBool(req.query.withoutBrand),
          kind: req.query.kind || undefined,
          unit: req.query.unit || undefined,
          status: parseBool(req.query.status),
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/movements", async (req, res) => {
  try {
    res.json(
      await listStockMovements(
        {
          idStore: req.query.idStore,
          idProduct: req.query.idProduct || undefined,
          type: req.query.type || undefined,
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/adjust", async (req, res) => {
  try {
    res.json(
      await adjustStock(
        {
          idStore: req.body?.idStore,
          idProduct: req.body?.idProduct,
          type: req.body?.type,
          quantity: req.body?.quantity,
          unitCost: req.body?.unitCost,
          note: req.body?.note,
        },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
