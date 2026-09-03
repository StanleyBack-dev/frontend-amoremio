import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  createSupplier,
  getSupplierById,
  listSupplierFilterOptions,
  listSuppliers,
  updateSupplier,
} from "./service.js";

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

function supplierBody(body) {
  return {
    idStore: body?.idStore,
    name: body?.name,
    phone: body?.phone,
    email: body?.email,
    address: body?.address,
    instagram: body?.instagram,
    document: body?.document,
    notes: body?.notes,
    status: body?.status,
  };
}

router.get("/", async (req, res) => {
  try {
    const input = {
      idStore: req.query.idStore,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search || undefined,
      status: parseBool(req.query.status),
      name: req.query.name || undefined,
      createdByUserId: req.query.createdByUserId || undefined,
    };
    res.json(await listSuppliers(input, getAuthContext(req), req.requestId));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/filter-options", async (req, res) => {
  try {
    res.json(
      await listSupplierFilterOptions(
        { idStore: req.query.idStore },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idSupplier", async (req, res) => {
  try {
    res.json(
      await getSupplierById(
        { idStore: req.query.idStore, idSupplier: req.params.idSupplier },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const supplier = await createSupplier(
      supplierBody(req.body),
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(supplier);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idSupplier", async (req, res) => {
  try {
    const supplier = await updateSupplier(
      { ...supplierBody(req.body), idSupplier: req.params.idSupplier },
      getAuthContext(req),
      req.requestId,
    );
    res.json(supplier);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
