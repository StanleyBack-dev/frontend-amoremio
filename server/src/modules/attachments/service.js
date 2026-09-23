import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CONFIRM_ATTACHMENT_UPLOAD_MUTATION,
  GET_ATTACHMENTS_QUERY,
  REMOVE_ATTACHMENT_MUTATION,
  REORDER_ATTACHMENTS_MUTATION,
  REQUEST_ATTACHMENT_UPLOAD_MUTATION,
  SET_ATTACHMENT_AS_COVER_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

function run(query, input, authContext, requestId) {
  return executeGraphql({
    query,
    variables: { input },
    requestId,
    ...authContext,
  });
}

export async function listAttachments(input, authContext, requestId) {
  const data = await run(GET_ATTACHMENTS_QUERY, input, authContext, requestId);
  return requireData(data.getAttachments, "Invalid attachments response.");
}

// Only hands out the signed upload form: the file itself goes straight from
// the browser to object storage and never passes through this server.
export async function requestAttachmentUpload(input, authContext, requestId) {
  const data = await run(
    REQUEST_ATTACHMENT_UPLOAD_MUTATION,
    input,
    authContext,
    requestId,
  );
  return requireData(
    data.requestAttachmentUpload?.data,
    "Invalid upload request response.",
  );
}

export async function confirmAttachmentUpload(input, authContext, requestId) {
  const data = await run(
    CONFIRM_ATTACHMENT_UPLOAD_MUTATION,
    input,
    authContext,
    requestId,
  );
  return requireData(
    data.confirmAttachmentUpload?.data,
    "Invalid upload confirmation response.",
  );
}

export async function removeAttachment(input, authContext, requestId) {
  const data = await run(
    REMOVE_ATTACHMENT_MUTATION,
    input,
    authContext,
    requestId,
  );
  return requireData(data.removeAttachment, "Invalid remove response.");
}

export async function reorderAttachments(input, authContext, requestId) {
  const data = await run(
    REORDER_ATTACHMENTS_MUTATION,
    input,
    authContext,
    requestId,
  );
  return requireData(
    data.reorderAttachments?.data,
    "Invalid reorder response.",
  );
}

export async function setAttachmentAsCover(input, authContext, requestId) {
  const data = await run(
    SET_ATTACHMENT_AS_COVER_MUTATION,
    input,
    authContext,
    requestId,
  );
  return requireData(
    data.setAttachmentAsCover?.data,
    "Invalid set cover response.",
  );
}
