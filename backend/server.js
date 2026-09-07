const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Game state
const waitingPlayers = [];
const activeGames = new Map();
const playerSessions = new Map();

// Quiz questions
const QUESTIONS = [
  { id: 1, text: "What is the capital of France?", category: "Geography", answers: ["Paris", "London", "Berlin", "Madrid"], correct: 0 },
  { id: 2, text: "Who painted the Mona Lisa?", category: "Art", answers: ["Van Gogh", "Leonardo da Vinci", "Picasso", "Michelangelo"], correct: 1 },
  { id: 3, text: "What is the largest planet?", category: "Science", answers: ["Saturn", "Mars", "Jupiter", "Neptune"], correct: 2 },
  { id: 4, text: "Who wrote Romeo and Juliet?", category: "Literature", answers: ["Marlowe", "Shakespeare", "Bacon", "Kyd"], correct: 1 },
  { id: 5, text: "What year did WW2 end?", category: "History", answers: ["1943", "1944", "1945", "1946"], correct: 2 },
];

const GAME_CONFIG = {
  ROUNDS: 6,
  TIME_PER_QUESTION: 10,
  POINTS_PER_QUESTION: 20,
};

// Generate game ID
function generateGameId() {
  return 'game_' + Math.random().toString(36).substr(2, 9);
}

// Find and shuffle questions
function getRandomQuestions(count) {
  const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Start a new game
function startGame(player1, player2) {
  const gameId = generateGameId();
  const questions = getRandomQuestions(GAME_CONFIG.ROUNDS);

  const game = {
    id: gameId,
    players: [
      { ws: player1.ws, id: player1.id, name: player1.name, score: 0, answers: [] },
      { ws: player2.ws, id: player2.id, name: player2.name, score: 0, answers: [] },
    ],
    questions,
    currentRound: 0,
    status: 'active',
    startTime: Date.now(),
  };

  activeGames.set(gameId, game);
  playerSessions.set(player1.id, gameId);
  playerSessions.set(player2.id, gameId);

  // Notify players game started
  game.players.forEach((p, idx) => {
    p.ws.send(JSON.stringify({
      type: 'game_start',
      gameId,
      opponent: game.players[1 - idx].name,
    }));
  });

  // Send first question
  sendQuestion(game, 0);
}

// Send question to both players
function sendQuestion(game, roundIndex) {
  if (roundIndex >= game.questions.length) {
    endGame(game);
    return;
  }

  const question = game.questions[roundIndex];
  const questionData = {
    type: 'question',
    round: roundIndex + 1,
    totalRounds: game.questions.length,
    question: question.text,
    category: question.category,
    answers: question.answers,
    timeLimit: GAME_CONFIG.TIME_PER_QUESTION,
  };

  game.players.forEach(p => {
    p.ws.send(JSON.stringify(questionData));
  });

  game.currentRound = roundIndex;

  // Auto-advance after time limit (in case of no response)
  setTimeout(() => {
    if (game.status === 'active' && game.currentRound === roundIndex) {
      sendQuestion(game, roundIndex + 1);
    }
  }, (GAME_CONFIG.TIME_PER_QUESTION + 1) * 1000);
}

// End game and send results
function endGame(game) {
  game.status = 'finished';

  const winner = game.players[0].score > game.players[1].score ? 0 : (game.players[1].score > game.players[0].score ? 1 : -1);

  game.players.forEach((p, idx) => {
    p.ws.send(JSON.stringify({
      type: 'game_end',
      finalScore: p.score,
      opponentScore: game.players[1 - idx].score,
      winner: winner === idx ? true : (winner === -1 ? 'tie' : false),
      leaderboard: game.players.map(pl => ({ name: pl.name, score: pl.score })),
    }));
  });

  // Cleanup
  setTimeout(() => {
    game.players.forEach(p => playerSessions.delete(p.id));
    activeGames.delete(game.id);
  }, 5000);
}

// WebSocket handlers
wss.on('connection', (ws) => {
  const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
  let playerName = 'Player ' + Math.floor(Math.random() * 9000);
  let isMatched = false;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        playerName = data.name || playerName;
        ws.send(JSON.stringify({ type: 'joined', playerId, playerName }));

        if (waitingPlayers.length > 0) {
          const opponent = waitingPlayers.pop();
          isMatched = true;
          opponent.isMatched = true;
          startGame({ ws, id: playerId, name: playerName }, opponent);
        } else {
          waitingPlayers.push({ ws, id: playerId, name: playerName, isMatched: false });
          ws.send(JSON.stringify({ type: 'waiting', message: 'Waiting for opponent...' }));
        }
      }

      if (data.type === 'answer') {
        const gameId = playerSessions.get(playerId);
        if (gameId && activeGames.has(gameId)) {
          const game = activeGames.get(gameId);
          const playerIdx = game.players.findIndex(p => p.id === playerId);

          if (playerIdx !== -1) {
            const currentQuestion = game.questions[game.currentRound];
            const isCorrect = data.answerIndex === currentQuestion.correct;

            if (isCorrect) {
              game.players[playerIdx].score += GAME_CONFIG.POINTS_PER_QUESTION;
            }

            // Check if both players answered
            const allAnswered = game.players.every(p => p.answers.length > game.currentRound);
            if (allAnswered || game.players.some(p => p.ws.readyState === 3)) {
              setTimeout(() => sendQuestion(game, game.currentRound + 1), 500);
            }
          }
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  ws.on('close', () => {
    const gameId = playerSessions.get(playerId);
    if (gameId && activeGames.has(gameId)) {
      endGame(activeGames.get(gameId));
    }

    const idx = waitingPlayers.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      waitingPlayers.splice(idx, 1);
    }
    playerSessions.delete(playerId);
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

server.listen(PORT, () => {
  console.log(`🎮 QuizzUp Backend running on http://localhost:${PORT}`);
});
