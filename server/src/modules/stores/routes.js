import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  addStoreMember,
  createStore,
  getStoreById,
  listMyStores,
  listStoreMembers,
  removeStoreMember,
  updateStore,
  updateStoreMemberRole,
} from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

router.get("/", async (req, res) => {
  try {
    res.json(await listMyStores(getAuthContext(req), req.requestId));
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const store = await createStore(
      {
        name: req.body?.name,
        legalName: req.body?.legalName,
        cnpj: req.body?.cnpj,
        whatsapp: req.body?.whatsapp,
        email: req.body?.email,
        instagram: req.body?.instagram,
        ifoodUrl: req.body?.ifoodUrl,
        food99Url: req.body?.food99Url,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(store);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idStore", async (req, res) => {
  try {
    res.json(
      await getStoreById(
        req.params.idStore,
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idStore", async (req, res) => {
  try {
    const store = await updateStore(
      {
        idStore: req.params.idStore,
        name: req.body?.name,
        legalName: req.body?.legalName,
        cnpj: req.body?.cnpj,
        whatsapp: req.body?.whatsapp,
        email: req.body?.email,
        instagram: req.body?.instagram,
        ifoodUrl: req.body?.ifoodUrl,
        food99Url: req.body?.food99Url,
        status: req.body?.status,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(store);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:idStore/members", async (req, res) => {
  try {
    res.json(
      await listStoreMembers(
        req.params.idStore,
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/:idStore/members", async (req, res) => {
  try {
    const members = await addStoreMember(
      {
        idStore: req.params.idStore,
        idUsers: req.body?.idUsers,
        role: req.body?.role,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(members);
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:idStore/members/:idUsers", async (req, res) => {
  try {
    const members = await updateStoreMemberRole(
      {
        idStore: req.params.idStore,
        idUsers: req.params.idUsers,
        role: req.body?.role,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(members);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/:idStore/members/:idUsers", async (req, res) => {
  try {
    const members = await removeStoreMember(
      {
        idStore: req.params.idStore,
        idUsers: req.params.idUsers,
      },
      getAuthContext(req),
      req.requestId,
    );
    res.json(members);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
