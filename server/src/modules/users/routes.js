import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import { buildListInput } from "../../shared/http/parse-pagination.js";
import {
  createUser,
  getMyProfile,
  getUserFilterOptions,
  getUserPagePermissions,
  listUsers,
  unlockUser,
  updateMyProfile,
  updateUser,
} from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

router.get("/me", async (req, res) => {
  try {
    const profile = await getMyProfile(getAuthContext(req), req.requestId);
    res.json(profile);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/me", async (req, res) => {
  try {
    const profile = await updateMyProfile(
      req.body,
      getAuthContext(req),
      req.requestId,
    );
    res.json(profile);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const input = buildListInput(req.query, [
      "name",
      "email",
      "username",
      "group",
    ]);
    if (typeof req.query.status === "string") {
      if (req.query.status === "true") {
        input.status = true;
      } else if (req.query.status === "false") {
        input.status = false;
      }
    }

    const users = await listUsers(input, getAuthContext(req), req.requestId);
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const user = await createUser(req.body, getAuthContext(req), req.requestId);
    res.status(201).json(user);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/filter-options", async (req, res) => {
  try {
    const options = await getUserFilterOptions(
      getAuthContext(req),
      req.requestId,
    );
    res.json(options);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idUsers", async (req, res) => {
  try {
    const user = await updateUser(
      req.params.idUsers,
      req.body,
      getAuthContext(req),
      req.requestId,
    );
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idUsers/page-permissions", async (req, res) => {
  try {
    const permissions = await getUserPagePermissions(
      req.params.idUsers,
      getAuthContext(req),
      req.requestId,
    );
    res.json(permissions);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/:idUsers/unlock", async (req, res) => {
  try {
    const result = await unlockUser(
      req.params.idUsers,
      getAuthContext(req),
      req.requestId,
    );
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
