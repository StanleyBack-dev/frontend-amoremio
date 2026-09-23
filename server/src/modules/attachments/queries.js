export const ATTACHMENT_FIELDS = `
  idAttachment
  ownerType
  ownerId
  position
  mimeType
  sizeBytes
  width
  height
  originalName
  url
  thumbnailUrl
  createdAt
`;

export const GET_ATTACHMENTS_QUERY = `
  query GetAttachments($input: AttachmentOwnerInputDto!) {
    getAttachments(input: $input) {
      ${ATTACHMENT_FIELDS}
    }
  }
`;

export const REQUEST_ATTACHMENT_UPLOAD_MUTATION = `
  mutation RequestAttachmentUpload($input: RequestAttachmentUploadInputDto!) {
    requestAttachmentUpload(input: $input) {
      data {
        idAttachment
        uploadUrl
        fields {
          name
          value
        }
        expiresAt
        maxBytes
      }
    }
  }
`;

export const CONFIRM_ATTACHMENT_UPLOAD_MUTATION = `
  mutation ConfirmAttachmentUpload($input: AttachmentRefInputDto!) {
    confirmAttachmentUpload(input: $input) {
      data {
        ${ATTACHMENT_FIELDS}
      }
    }
  }
`;

export const REMOVE_ATTACHMENT_MUTATION = `
  mutation RemoveAttachment($input: AttachmentRefInputDto!) {
    removeAttachment(input: $input) {
      success
    }
  }
`;

export const REORDER_ATTACHMENTS_MUTATION = `
  mutation ReorderAttachments($input: ReorderAttachmentsInputDto!) {
    reorderAttachments(input: $input) {
      data {
        ${ATTACHMENT_FIELDS}
      }
    }
  }
`;

export const SET_ATTACHMENT_AS_COVER_MUTATION = `
  mutation SetAttachmentAsCover($input: AttachmentRefInputDto!) {
    setAttachmentAsCover(input: $input) {
      data {
        ${ATTACHMENT_FIELDS}
      }
    }
  }
`;
