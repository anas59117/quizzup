// Direction: existing QuizzUp warm surfaces and bold controls.
// Rules: native labelled controls, generous touch targets, no new visual system.
// Signature: a live circular crop matching the public player identity.
import React, { useEffect, useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { isProfilePhoto, validatePhotoFile } from './profile-photo';

export function ProfilePhotoEditor({ avatar, fallbackAvatar, draft, onChange, onRemove, busy }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!draft?.file) { setPreview(null); return; }
    const url = URL.createObjectURL(draft.file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft?.file]);
  function choose(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { validatePhotoFile(file); setError(''); onChange({ file, zoom: 1 }); }
    catch (err) { setError(err.message); }
  }
  return <section className="profile-photo-editor" aria-label="Photo personnelle">
    <div className="profile-photo-preview" aria-label="Aperçu de la photo">
      {preview && draft?.file ? <img src={preview} alt="Aperçu du recadrage" style={{ transform: `scale(${draft.zoom})` }} onError={() => setError('Cette photo ne peut pas être ouverte.')} /> : <PlayerAvatar avatar={avatar} fallbackAvatar={fallbackAvatar} />}
    </div>
    <div className="profile-photo-controls">
      <label className="profile-photo-upload">{isProfilePhoto(avatar) || draft ? 'Changer la photo' : 'Ajouter ma photo'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} disabled={busy} aria-label="Choisir ma photo" />
      </label>
      <p>Ton visage dans le profil, les duels et les classements.</p>
      {(draft || isProfilePhoto(avatar)) && <button type="button" onClick={onRemove} disabled={busy}>Retirer la photo</button>}
    </div>
    {draft && <label className="profile-photo-zoom">Recadrage centré · zoom
      <input type="range" min="1" max="2.5" step="0.05" value={draft.zoom} onChange={e => onChange({ ...draft, zoom: Number(e.target.value) })} disabled={busy} />
    </label>}
    {error && <p className="profile-photo-error" role="alert">{error}</p>}
  </section>;
}
