import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';

test('clearing a saved or removed draft renders the public avatar before preview cleanup', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => 'blob:photo-preview');
  URL.revokeObjectURL = jest.fn();
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
  const props = { avatar: 'fox', fallbackAvatar: 'robot', onChange: jest.fn(), onRemove: jest.fn() };
  try {
    act(() => root.render(<ProfilePhotoEditor {...props} draft={{ file, zoom: 1.5 }} />));
    expect(container.querySelector('img').getAttribute('src')).toBe('blob:photo-preview');
    act(() => root.render(<ProfilePhotoEditor {...props} draft={null} />));
    expect(container.querySelector('.profile-photo-preview img')).toBeNull();
    expect(container.querySelector('.player-avatar').dataset.avatar).toBe('fox');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
  } finally {
    act(() => root.unmount()); container.remove();
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
  }
});
