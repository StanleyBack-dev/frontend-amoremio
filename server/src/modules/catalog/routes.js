import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  createProduct,
  getProductById,
  listProductFilterOptions,
  listProducts,
  updateProduct,
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

function parseKinds(value) {
  if (!value) return undefined;
  const list = (Array.isArray(value) ? value : String(value).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

router.get("/", async (req, res) => {
  try {
    const input = {
      idStore: req.query.idStore,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search || undefined,
      status: parseBool(req.query.status),
      kinds: parseKinds(req.query.kinds),
      name: req.query.name || undefined,
      brand: req.query.brand || undefined,
      withoutBrand: parseBool(req.query.withoutBrand),
      unit: req.query.unit || undefined,
      createdByUserId: req.query.createdByUserId || undefined,
    };
    res.json(await listProducts(input, getAuthContext(req), req.requestId));
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/filter-options", async (req, res) => {
  try {
    res.json(
      await listProductFilterOptions(
        { idStore: req.query.idStore },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idProduct", async (req, res) => {
  try {
    res.json(
      await getProductById(
        { idStore: req.query.idStore, idProduct: req.params.idProduct },
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
    const product = await createProduct(
      {
        idStore: req.body?.idStore,
        name: req.body?.name,
        description: req.body?.description,
        brand: req.body?.brand,
        kind: req.body?.kind,
        unit: req.body?.unit,
        packagingUnit: req.body?.packagingUnit,
        packSize: req.body?.packSize,
        salePrice: req.body?.salePrice,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(product);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idProduct", async (req, res) => {
  try {
    const product = await updateProduct(
      {
        idStore: req.body?.idStore,
        idProduct: req.params.idProduct,
        name: req.body?.name,
        description: req.body?.description,
        brand: req.body?.brand,
        kind: req.body?.kind,
        unit: req.body?.unit,
        packagingUnit: req.body?.packagingUnit,
        packSize: req.body?.packSize,
        salePrice: req.body?.salePrice,
        status: req.body?.status,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(product);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
