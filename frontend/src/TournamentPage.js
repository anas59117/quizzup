import React from 'react';

function TournamentPage({ topic, myName, myAvatar, onHome }) {
  return React.createElement('div', { className: 'container center' },
    React.createElement('div', { style: { textAlign: 'center', padding: 40 } },
      React.createElement('h2', { style: { color: '#fff' } }, '🏆 Tournament Mode'),
      React.createElement('p', { style: { color: 'rgba(255,255,255,0.6)' } }, 'Coming soon...'),
      React.createElement('button', {
        style: { padding: '12px 24px', borderRadius: 12, background: '#ff4d6d', color: '#fff', border: 'none', fontWeight: 800, marginTop: 20, cursor: 'pointer' },
        onClick: onHome
      }, 'Back Home')
    )
  );
}

export default TournamentPage;
