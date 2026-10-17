import { getBackendOrigin } from './backend';
import { ensureSignedIn } from './firebase';

export const isProfilePhoto = value => typeof value === 'string'
  && /^\/profile-photos\/[a-f0-9]{24}-[a-f0-9]{32}\.jpg$/.test(value);
export const profilePhotoUrl = value => isProfilePhoto(value) ? `${getBackendOrigin()}${value}` : null;

export function validatePhotoFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choisis une photo JPEG, PNG ou WebP.');
  if (!file.size || file.size > 12 * 1024 * 1024) throw new Error('La photo doit faire moins de 12 Mo.');
}

export async function prepareProfilePhoto(file, zoom = 1) {
  validatePhotoFile(file);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Cette photo ne peut pas être ouverte.'));
      img.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Cette photo est trop grande. Choisis une image plus petite.');
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('La préparation de la photo est indisponible.');
    const side = Math.min(image.naturalWidth, image.naturalHeight) / Math.max(1, Math.min(2.5, Number(zoom) || 1));
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    for (const quality of [0.86, 0.72, 0.56]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob?.type === 'image/jpeg' && blob.size <= 256 * 1024) return blob;
    }
    throw new Error('Cette photo est trop lourde. Choisis une image plus simple.');
  } finally { URL.revokeObjectURL(url); }
}

export async function uploadProfilePhoto(draft) {
  const blob = await prepareProfilePhoto(draft.file, draft.zoom);
  const user = await ensureSignedIn();
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(`${getBackendOrigin()}/profile-photo`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' }, body: blob, signal: controller.signal,
    });
  } catch {
    throw new Error('La photo n’a pas pu être envoyée. Vérifie ta connexion puis réessaie.');
  } finally { clearTimeout(timeout); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !isProfilePhoto(data.avatar)) throw new Error(response.status === 429
    ? 'Trop de changements. Patiente une minute avant de réessayer.'
    : 'La photo n’a pas pu être enregistrée. Réessaie.');
  return data.avatar;
}
