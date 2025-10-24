import type { FormEvent } from "react";
import { useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { MediaEditDialogUpdateMediaMutation } from "./__generated__/MediaEditDialogUpdateMediaMutation.graphql";
import type { MediaLibraryFragment$data } from "./__generated__/MediaLibraryFragment.graphql";

type MediaNode = NonNullable<
  NonNullable<NonNullable<MediaLibraryFragment$data["medias"]>["edges"]>[number]
>["node"];

type MediaEditDialogProps = {
  media: MediaNode;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const updateMediaMutation = graphql`
  mutation MediaEditDialogUpdateMediaMutation($input: UpdateMediaInput!) {
    updateMedia(input: $input) {
      media {
        id
        title
        altText
        caption
        description
        updatedAt
      }
    }
  }
`;

export function MediaEditDialog({ media, onClose, onSuccess, onError }: MediaEditDialogProps) {
  const [title, setTitle] = useState(media.title ?? "");
  const [altText, setAltText] = useState(media.altText ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [description, setDescription] = useState(media.description ?? "");
  const [commit, isInFlight] = useMutation<MediaEditDialogUpdateMediaMutation>(updateMediaMutation);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit({
      variables: {
        input: {
          id: media.id,
          title: title.trim() ? title : null,
          altText: altText.trim() ? altText : null,
          caption: caption.trim() ? caption : null,
          description: description.trim() ? description : null,
        },
      },
      onCompleted: () => {
        onSuccess("Media metadata updated successfully.");
        onClose();
      },
      onError: () => {
        onError("Unable to update media metadata. Try again.");
      },
    });
  };

  return (
    <div className="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-edit-heading">
      <div className="media-dialog__panel">
        <h3 id="media-edit-heading">Edit metadata for {media.fileName}</h3>
        <form className="media-dialog__form" onSubmit={handleSubmit}>
          <div className="media-dialog__field">
            <label htmlFor="media-title">Title</label>
            <input
              id="media-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isInFlight}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-alt-text">Alt text</label>
            <input
              id="media-alt-text"
              type="text"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              disabled={isInFlight}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-caption">Caption</label>
            <input
              id="media-caption"
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              disabled={isInFlight}
            />
          </div>
          <div className="media-dialog__field">
            <label htmlFor="media-description">Description</label>
            <textarea
              id="media-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isInFlight}
              rows={4}
            />
          </div>
          <div className="media-dialog__actions">
            <button type="button" onClick={onClose} disabled={isInFlight}>
              Cancel
            </button>
            <button type="submit" disabled={isInFlight}>
              {isInFlight ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
