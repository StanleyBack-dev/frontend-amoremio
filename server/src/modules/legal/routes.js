import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import { acceptTermsOfUse, getMyTermsAcceptanceStatus } from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

router.get("/terms-status", async (req, res) => {
  try {
    const result = await getMyTermsAcceptanceStatus(
      getAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/accept-terms", async (req, res) => {
  try {
    const result = await acceptTermsOfUse(getAuthContext(req), req.requestId);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
