import React from 'react';

export default function TournamentPage({ topic, myName, myAvatar, onHome }) {
  return (
    <div className="container center">
      <div style={{textAlign: 'center', padding: 40}}>
        <h2 style={{color: '#fff'}}>🏆 Tournament Mode</h2>
        <p style={{color: 'rgba(255,255,255,0.6)'}}>Coming soon...</p>
        <p style={{color: 'rgba(255,255,255,0.4)'}}>Topic: {topic?.label || 'General'}</p>
        <p style={{color: 'rgba(255,255,255,0.4)'}}>Player: {myAvatar} {myName}</p>
        <button 
          style={{padding: '12px 24px', borderRadius: 12, background: '#ff4d6d', color: '#fff', border: 'none', fontWeight: 800, marginTop: 20, cursor: 'pointer'}}
          onClick={onHome}
        >
          Back Home
        </button>
      </div>
    </div>
  );
}
