import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [stage, setStage] = useState('join'); // join, waiting, playing, finished
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [result, setResult] = useState(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const connectWebSocket = (name) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'join', name }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'joined') {
        setPlayerId(data.playerId);
      }

      if (data.type === 'waiting') {
        setStage('waiting');
      }

      if (data.type === 'game_start') {
        setOpponentName(data.opponent);
        setStage('playing');
        setScore(0);
        setOpponentScore(0);
      }

      if (data.type === 'question') {
        setCurrentQuestion(data);
        setRound(data.round);
        setSelectedAnswer(null);
        setTimeLeft(data.timeLimit);
      }

      if (data.type === 'game_end') {
        setStage('finished');
        setResult(data);
        setOpponentScore(data.opponentScore);
      }
    };

    wsRef.current.onerror = (err) => console.error('WS Error:', err);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      setPlayerName(playerName);
      connectWebSocket(playerName);
    }
  };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(index);
      setScore(score + 20); // Assume correct for MVP
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answerIndex: index,
      }));
    }
  };

  return (
    <div className="app">
      {stage === 'join' && (
        <div className="container join-screen">
          <h1>🎮 QuizzUp 2.0</h1>
          <p>Real-time Multiplayer Quiz</p>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn">Join Game</button>
          </form>
        </div>
      )}

      {stage === 'waiting' && (
        <div className="container waiting-screen">
          <h2>Waiting for opponent...</h2>
          <div className="spinner"></div>
          <p className="player-name">{playerName}</p>
        </div>
      )}

      {stage === 'playing' && currentQuestion && (
        <div className="container game-screen">
          <div className="header">
            <div className="player-info">
              <span>{playerName}</span>
              <span className="score">{score}</span>
            </div>
            <div className="round-counter">Round {round}/6</div>
            <div className="player-info opponent">
              <span className="score">{opponentScore}</span>
              <span>{opponentName}</span>
            </div>
          </div>

          <div className="question-box">
            <p className="category">{currentQuestion.category}</p>
            <h2>{currentQuestion.question}</h2>
            <p className="timer">⏱️ {timeLeft}s</p>
          </div>

          <div className="answers">
            {currentQuestion.answers.map((answer, idx) => (
              <button
                key={idx}
                className={`answer-btn ${selectedAnswer === idx ? 'selected' : ''} ${selectedAnswer !== null ? 'disabled' : ''}`}
                onClick={() => handleAnswerSelect(idx)}
                disabled={selectedAnswer !== null}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'finished' && result && (
        <div className="container result-screen">
          <h2>{result.winner === true ? '🎉 You Won!' : result.winner === 'tie' ? '🤝 Tie!' : '😅 You Lost'}</h2>
          <div className="final-scores">
            <div>
              <p className="winner-name">{playerName}</p>
              <p className="final-score">{result.finalScore}</p>
            </div>
            <div className="vs">vs</div>
            <div>
              <p className="winner-name">{opponentName}</p>
              <p className="final-score">{result.opponentScore}</p>
            </div>
          </div>
          <button className="btn" onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
    </div>
  );
}
