import React from 'react';
import { useI18n } from './i18n';
import './FriendInviteActions.css';

export function FriendInviteActions({ onInviteFriend, onJoinFriend, pending = false }) {
  const { t } = useI18n();
  return (
    <div className="friend-invite-actions" role="group" aria-label={t('friendInviteActions')}>
      <button type="button" onClick={onInviteFriend} disabled={pending || !onInviteFriend}>{t('inviteFriend')}</button>
      <button type="button" onClick={onJoinFriend} disabled={pending || !onJoinFriend}>{t('haveFriendCode')}</button>
    </div>
  );
}
