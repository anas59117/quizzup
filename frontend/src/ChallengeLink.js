/**
 * ChallengeLink — Système de défis par lien entre amis
 * Génère un lien unique de défi, affiche QR code optionnel
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useI18n } from './i18n';
import SFX from './sounds';

function generateChallengeCode(topicKey, fromName) {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const nameSlug = fromName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) || 'player';
  return `${topicKey}-${nameSlug}-${rand}`;
}

export function ChallengeButton({ topic, myName, myAvatar, compact = false }) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);

  if (compact) {
    return (
      <>
        <button className="challenge-btn-compact" onClick={() => { SFX.select(); setShowModal(true); }}>
          ⚔️
        </button>
        {showModal && (
          <ChallengeModal
            topic={topic}
            myName={myName}
            myAvatar={myAvatar}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button className="challenge-btn" onClick={() => { SFX.select(); setShowModal(true); }}>
        ⚔️ {t('challengeFriend')}
      </button>
      {showModal && (
        <ChallengeModal
          topic={topic}
          myName={myName}
          myAvatar={myAvatar}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function ChallengeModal({ topic, myName, myAvatar, onClose }) {
  const { t, lang } = useI18n();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const c = generateChallengeCode(topic?.key || 'general', myName);
    setCode(c);
  }, [topic, myName]);

  const baseUrl = 'https://quizzup-ten.vercel.app';
  const challengeUrl = `${baseUrl}/challenge/${code}`;

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      SFX.select();
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(challengeUrl).then(() => {
      setLinkCopied(true);
      SFX.select();
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [challengeUrl]);

  const shareText = lang === 'en'
    ? `🏆 Challenge me on QuizzUp!\nTheme: ${topic?.label || 'General'}\nCode: ${code}\n${challengeUrl}`
    : `🏆 Défie-moi sur QuizzUp !\nThème : ${topic?.label || 'Général'}\nCode : ${code}\n${challengeUrl}`;

  const nativeShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'QuizzUp Challenge',
        text: shareText,
        url: challengeUrl,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }, [challengeUrl, shareText]);

  return (
    <div className="challenge-overlay" onClick={onClose}>
      <div className="challenge-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="challenge-title">⚔️ {t('challengeTitle')}</h3>

        <div className="challenge-topic">
          <span className="challenge-topic-icon">{topic?.image || '🎯'}</span>
          <span className="challenge-topic-label">{topic?.label || t('general')}</span>
        </div>

        <div className="challenge-code-box">
          <div className="challenge-code">{code}</div>
          <button className="challenge-copy-btn" onClick={copyCode}>
            {copied ? '✅' : '📋'}
          </button>
        </div>
        <p className="challenge-hint">{t('challengeCodeHint')}</p>

        <div className="challenge-actions">
          <button className="challenge-action primary" onClick={nativeShare}>
            📤 {t('shareChallenge')}
          </button>
          <button className="challenge-action" onClick={copyLink}>
            {linkCopied ? '✅ ' + t('copied') : '📋 ' + t('copyLink')}
          </button>
        </div>

        <div className="challenge-player">
          <span className="challenge-from">{t('challengeFrom')}</span>
          <span className="challenge-avatar">{myAvatar}</span>
          <span className="challenge-name">{myName}</span>
        </div>

        <button className="challenge-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

export function ChallengeReceiver({ code, onAccept, onDecline }) {
  const { t } = useI18n();
  const [decoded, setDecoded] = useState(null);

  useEffect(() => {
    if (!code) return;
    const parts = code.split('-');
    const topicKey = parts[0];
    const fromName = parts.slice(1, -1).join('-') || 'Unknown';
    setDecoded({ topicKey, fromName });
  }, [code]);

  if (!decoded) return null;

  return (
    <div className="challenge-receiver-overlay">
      <div className="challenge-receiver-card">
        <div className="cr-emoji">⚔️</div>
        <h3 className="cr-title">{t('challengeReceived')}</h3>
        <p className="cr-desc">
          {t('challengeFromPlayer', { name: decoded.fromName })}
        </p>
        <div className="cr-topic">{decoded.topicKey}</div>
        <div className="cr-actions">
          <button className="cr-btn accept" onClick={() => onAccept(decoded)}>
            {t('acceptChallenge')}
          </button>
          <button className="cr-btn decline" onClick={onDecline}>
            {t('decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
