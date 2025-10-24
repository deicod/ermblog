import type { FormEvent } from "react";
import { useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { MediaUploadDialogCreateMediaMutation } from "./__generated__/MediaUploadDialogCreateMediaMutation.graphql";

type MediaUploadDialogProps = {
  uploadEndpoint: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const createMediaMutation = graphql`
  mutation MediaUploadDialogCreateMediaMutation($input: CreateMediaInput!) {
    createMedia(input: $input) {
      media {
        id
        fileName
        mimeType
        fileSizeBytes
        uploadedByID
        createdAt
        updatedAt
        title
        altText
        caption
        description
        url
      }
    }
  }
`;

export function MediaUploadDialog({ uploadEndpoint, onClose, onSuccess, onError }: MediaUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setUploading] = useState(false);
  const [commit, isInFlight] = useMutation<MediaUploadDialogCreateMediaMutation>(createMediaMutation);

  const busy = isUploading || isInFlight;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      onError("Select a file to upload before submitting.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = (await response.json()) as {
        storageKey?: string;
        url?: string;
      };

      if (!payload?.storageKey || !payload?.url) {
        throw new Error("Invalid upload response");
      }

      commit({
        variables: {
          input: {
            fileName: selectedFile.name,
            mimeType: selectedFile.type || "application/octet-stream",
            fileSizeBytes: selectedFile.size,
            storageKey: payload.storageKey,
            url: payload.url,
            title: title.trim() ? title : null,
            altText: altText.trim() ? altText : null,
            caption: caption.trim() ? caption : null,
            description: description.trim() ? description : null,
          },
        },
        onCompleted: () => {
          setUploading(false);
          onSuccess("Media uploaded successfully.");
          onClose();
        },
        onError: () => {
          setUploading(false);
          onError("Unable to create the media entry. Try again.");
        },
      });
    } catch (error) {
      setUploading(false);
      onError("Uploading the file failed. Check the storage service and retry.");
    }
  };

  return (
    <div className="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-upload-heading">
      <div className="media-dialog__panel">
        <h3 id="media-upload-heading">Upload new media</h3>
        <form className="media-dialog__form" onSubmit={handleSubmit}>
          <div className="media-dialog__field">
            <label htmlFor="media-upload-input">Select file</label>
            <input
              id="media-upload-input"
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedFile(nextFile);
              }}
              disabled={busy}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-upload-title">Title</label>
            <input
              id="media-upload-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-upload-alt-text">Alt text</label>
            <input
              id="media-upload-alt-text"
              type="text"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-upload-caption">Caption</label>
            <input
              id="media-upload-caption"
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-upload-description">Description</label>
            <textarea
              id="media-upload-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={busy}
              rows={4}
            />
          </div>
          <div className="media-dialog__actions">
            <button type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
