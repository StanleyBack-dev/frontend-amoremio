import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  createCustomer,
  getCustomerById,
  listCustomerFilterOptions,
  listCustomers,
  updateCustomer,
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

function customerBody(body) {
  return {
    idStore: body?.idStore,
    name: body?.name,
    phone: body?.phone,
    email: body?.email,
    address: body?.address,
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
    res.json(await listCustomers(input, getAuthContext(req), req.requestId));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/filter-options", async (req, res) => {
  try {
    res.json(
      await listCustomerFilterOptions(
        { idStore: req.query.idStore },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idCustomer", async (req, res) => {
  try {
    res.json(
      await getCustomerById(
        { idStore: req.query.idStore, idCustomer: req.params.idCustomer },
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
    const customer = await createCustomer(
      customerBody(req.body),
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(customer);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idCustomer", async (req, res) => {
  try {
    const customer = await updateCustomer(
      { ...customerBody(req.body), idCustomer: req.params.idCustomer },
      getAuthContext(req),
      req.requestId,
    );
    res.json(customer);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
