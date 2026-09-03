import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  changeMyPassword,
  completeOnboardingTour,
  getMyPagePermissions,
  login,
  logout,
  refreshAuthSession,
  requestPasswordRecovery,
  resetPasswordWithRecovery,
  verifyPasswordRecoveryCode,
} from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

function optionalAuthContext(req) {
  try {
    return getAuthContext(req);
  } catch {
    return {};
  }
}

function forwardSetCookie(res, setCookie = []) {
  if (!Array.isArray(setCookie) || !setCookie.length) {
    return;
  }

  res.setHeader("Set-Cookie", setCookie);
}

router.post("/login", async (req, res) => {
  try {
    const { session, setCookie } = await login(
      req.body,
      optionalAuthContext(req),
      req.requestId,
    );
    forwardSetCookie(res, setCookie);
    res.json(session);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/session", async (req, res) => {
  try {
    const { session, setCookie } = await refreshAuthSession(
      getAuthContext(req),
      req.requestId,
    );
    forwardSetCookie(res, setCookie);
    res.json(session);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/me/page-permissions", async (req, res) => {
  try {
    const permissions = await getMyPagePermissions(
      getAuthContext(req),
      req.requestId,
    );
    res.json(permissions);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { result, setCookie } = await logout(
      getAuthContext(req),
      req.requestId,
    );
    forwardSetCookie(res, setCookie);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { result, setCookie } = await changeMyPassword(
      req.body,
      getAuthContext(req),
      req.requestId,
    );
    forwardSetCookie(res, setCookie);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/complete-onboarding-tour", async (req, res) => {
  try {
    const result = await completeOnboardingTour(
      getAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/password-recovery/request", async (req, res) => {
  try {
    const result = await requestPasswordRecovery(
      req.body,
      optionalAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/password-recovery/verify", async (req, res) => {
  try {
    const result = await verifyPasswordRecoveryCode(
      req.body,
      optionalAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/password-recovery/reset", async (req, res) => {
  try {
    const result = await resetPasswordWithRecovery(
      req.body,
      optionalAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
