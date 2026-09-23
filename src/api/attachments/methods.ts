import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  Attachment,
  AttachmentOwnerRef,
  RequestUploadPayload,
  UploadTicket,
} from "./schema";

export async function getAttachments(
  owner: AttachmentOwnerRef,
): Promise<Attachment[]> {
  try {
    const response = await apiHttp.get<Attachment[]>("/attachments", {
      params: owner,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar as imagens."),
    );
  }
}

export async function requestAttachmentUpload(
  payload: RequestUploadPayload,
): Promise<UploadTicket> {
  try {
    const response = await apiHttp.post<UploadTicket>(
      "/attachments/upload-intent",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível iniciar o envio da imagem."),
    );
  }
}

export async function confirmAttachmentUpload(
  idStore: string,
  idAttachment: string,
): Promise<Attachment> {
  try {
    const response = await apiHttp.post<Attachment>(
      `/attachments/${idAttachment}/confirm`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível processar a imagem."),
    );
  }
}

export async function removeAttachment(
  idStore: string,
  idAttachment: string,
): Promise<void> {
  try {
    await apiHttp.delete(`/attachments/${idAttachment}`, {
      params: { idStore },
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível remover a imagem."),
    );
  }
}

export async function reorderAttachments(
  owner: AttachmentOwnerRef,
  orderedIds: string[],
): Promise<Attachment[]> {
  try {
    const response = await apiHttp.put<Attachment[]>("/attachments/order", {
      ...owner,
      orderedIds,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível reordenar as imagens."),
    );
  }
}

// Sends the file straight to object storage using the signed form from
// requestAttachmentUpload. Deliberately not apiHttp: this request leaves the
// app's origin, must not carry app credentials, and must not go through
// the BFF (Vercel caps function bodies at 4.5 MB).
export async function uploadToStorage(
  ticket: UploadTicket,
  file: File,
): Promise<void> {
  const form = new FormData();
  // The storage validates the signed policy against these fields; the file
  // must be the last field of the form.
  for (const field of ticket.fields) {
    form.append(field.name, field.value);
  }
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch(ticket.uploadUrl, {
      method: "POST",
      body: form,
      credentials: "omit",
    });
  } catch {
    throw new Error("Falha de conexão ao enviar a imagem. Tente novamente.");
  }
  if (!response.ok) {
    throw new Error(
      response.status === 400
        ? "A imagem excede o tamanho permitido."
        : "O envio da imagem foi recusado. Tente novamente.",
    );
  }
}
