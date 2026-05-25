import thumbVideo from "@/assets/thumb-video.png";
import thumbAudio from "@/assets/thumb-audio.png";
import thumbText from "@/assets/thumb-text.png";
import thumbImage from "@/assets/thumb-image.png";

export type ContentTypeKey = string | null | undefined;

/**
 * Returns an illustrated fallback thumbnail (Comorian style)
 * for a given content type when no thumbnail_url is available.
 */
export function getFallbackThumbnail(type: ContentTypeKey): string {
  switch (type) {
    case "audio":
      return thumbAudio;
    case "text":
    case "story":
    case "pdf":
      return thumbText;
    case "image":
    case "photo":
      return thumbImage;
    case "video":
    default:
      return thumbVideo;
  }
}
