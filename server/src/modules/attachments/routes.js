import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import {
  confirmAttachmentUpload,
  listAttachments,
  removeAttachment,
  reorderAttachments,
  requestAttachmentUpload,
  setAttachmentAsCover,
} from "./service.js";

const router = Router();

function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}

router.get("/", async (req, res) => {
  try {
    res.json(
      await listAttachments(
        {
          idStore: req.query.idStore,
          ownerType: req.query.ownerType,
          ownerId: req.query.ownerId,
        },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/upload-intent", async (req, res) => {
  try {
    const ticket = await requestAttachmentUpload(
      {
        idStore: req.body?.idStore,
        ownerType: req.body?.ownerType,
        ownerId: req.body?.ownerId,
        fileName: req.body?.fileName,
        mimeType: req.body?.mimeType,
        sizeBytes: Number(req.body?.sizeBytes),
      },
      getAuthContext(req),
      req.requestId,
    );
    res.status(201).json(ticket);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/:idAttachment/confirm", async (req, res) => {
  try {
    res.json(
      await confirmAttachmentUpload(
        { idStore: req.body?.idStore, idAttachment: req.params.idAttachment },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/:idAttachment/cover", async (req, res) => {
  try {
    res.json(
      await setAttachmentAsCover(
        { idStore: req.body?.idStore, idAttachment: req.params.idAttachment },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/order", async (req, res) => {
  try {
    res.json(
      await reorderAttachments(
        {
          idStore: req.body?.idStore,
          ownerType: req.body?.ownerType,
          ownerId: req.body?.ownerId,
          orderedIds: Array.isArray(req.body?.orderedIds)
            ? req.body.orderedIds
            : [],
        },
        getAuthContext(req),
        req.requestId,
      ),
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/:idAttachment", async (req, res) => {
  try {
    await removeAttachment(
      { idStore: req.query.idStore, idAttachment: req.params.idAttachment },
      getAuthContext(req),
      req.requestId,
    );
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
