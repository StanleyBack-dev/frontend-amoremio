import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import { listUnmappedChannelProducts, mapChannelProduct } from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

router.get("/unmapped-products", async (req, res) => {
  try {
    res.json(
      await listUnmappedChannelProducts(
        { idStore: req.query.idStore },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/map-product", async (req, res) => {
  try {
    const result = await mapChannelProduct(
      {
        idStore: req.body?.idStore,
        channel: req.body?.channel,
        externalProductId: req.body?.externalProductId,
        externalProductName: req.body?.externalProductName,
        idProduct: req.body?.idProduct,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
