import { getBackendOrigin } from "./backend";
import { ensureSignedIn } from "./firebase";
import { prepareProfilePhoto } from "./profile-photo";
export const communityMediaUrl = (value) =>
  typeof value === "string" &&
  /^\/community-media\/[a-zA-Z0-9-]+\.jpg$/.test(value)
    ? `${getBackendOrigin()}${value}`
    : null;
export async function uploadCommunityPhoto(file) {
  const blob = await prepareProfilePhoto(file);
  const user = await ensureSignedIn();
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${getBackendOrigin()}/community-media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/jpeg",
      },
      body: blob,
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok || !communityMediaUrl(data.mediaUrl))
      throw new Error("Photo indisponible");
    return data.mediaUrl;
  } finally {
    clearTimeout(timeout);
  }
}
export async function shareCommunityPost(post) {
  const url = `${window.location.origin}/#post-${encodeURIComponent(post.id)}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "QuizzUp",
        text: post.text,
        url,
      });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled";
    }
  }
  if (!navigator.clipboard?.writeText) throw new Error("Partage indisponible");
  await navigator.clipboard.writeText(`${post.text}\n${url}`);
  return "copied";
}
