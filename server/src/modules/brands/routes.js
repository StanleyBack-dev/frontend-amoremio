import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  createBrand,
  getBrandById,
  listBrandFilterOptions,
  listBrands,
  updateBrand,
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
    res.json(await listBrands(input, getAuthContext(req), req.requestId));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/filter-options", async (req, res) => {
  try {
    res.json(
      await listBrandFilterOptions(
        { idStore: req.query.idStore },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idBrand", async (req, res) => {
  try {
    res.json(
      await getBrandById(
        { idStore: req.query.idStore, idBrand: req.params.idBrand },
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
    const brand = await createBrand(
      {
        idStore: req.body?.idStore,
        name: req.body?.name,
        status: req.body?.status,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(brand);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idBrand", async (req, res) => {
  try {
    const brand = await updateBrand(
      {
        idStore: req.body?.idStore,
        idBrand: req.params.idBrand,
        name: req.body?.name,
        status: req.body?.status,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(brand);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
