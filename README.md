# QuizzUp 2.0 — Real-time Multiplayer Quiz Game MVP

A viral quiz game with real-time multiplayer, cosmetics, and solid monetization.

## Features

✅ **Real-time Multiplayer** — WebSocket-based instant matchmaking
✅ **6 Rounds of Questions** — Category-based trivia
✅ **Live Scoring** — Points awarded for correct answers
✅ **Leaderboard Ready** — Track player stats
✅ **Clean UI** — Mobile-responsive design

## Architecture

```
backend/        Node.js + Express + WebSocket (port 3001)
frontend/       React (port 3000)
```

## Setup

### Backend
```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm start
```

App runs on http://localhost:3000

## Game Flow

1. Player joins game → name entry
2. Waits for opponent (matchmaking)
3. Game starts with 6 questions (10s each)
4. Players submit answers in real-time
5. Final score comparison + results

## Next Steps

- [ ] User authentication & profiles
- [ ] Cosmetics shop (avatars, effects)
- [ ] Battle pass system
- [ ] Leaderboards & rankings
- [ ] Affiliate links in results
- [ ] Analytics tracking
- [ ] Deploy to Railway/Vercel
- [ ] Mobile app wrapper (React Native)

## Monetization Strategy

- **Cosmetics**: Avatars, victory effects, skins ($2-5)
- **Battle Pass**: Seasonal rewards ($4.99/season)
- **Sponsored Categories**: Branded quizzes (Nike, Netflix)
- **Referral Bonus**: Invite friends = free cosmetics
- **Ads**: Optional rewarded videos for extra points


## Production configuration

The backend expects Firebase-authenticated WebSocket clients. Copy `backend/.env.example` and configure at least:

- `FIREBASE_API_KEY` — Firebase Web API key used to verify ID tokens.
- `CORS_ORIGIN` — exact frontend origin(s), comma-separated. Set this in production so WebSocket origin checks are not left open.
- `TRUST_PROXY=true` only when the backend is behind a trusted reverse proxy that owns `X-Forwarded-For`.
- `MAX_WS_CONNECTIONS_PER_IP` — optional per-IP connection cap (default 100, `0` disables it).
- `DATA_DIR` — optional durable directory for the current JSON stores. On Railway, point it to a mounted persistent Volume (for example `/data`) so stats/friends/feed/moderation survive container replacement.

The frontend Firebase/WebSocket variables are documented in `frontend/.env.example`.

## Reliability / security already implemented

- Server-authoritative answers, scoring and timers.
- Firebase ID-token verification before persistent gameplay/social actions.
- Match reconnect grace period and refresh recovery.
- Duplicate-account protection across matchmaking, rooms and game startup.
- WebSocket payload limit, heartbeat cleanup, origin validation and per-action rate limits.
- Crash-resistant JSON persistence: serialized atomic writes + backup recovery.
- Optional `DATA_DIR` for a mounted persistent volume without changing the current store APIs.
- GitHub Actions CI: backend syntax/tests + production frontend build.

The JSON stores are still intentionally **single-instance MVP storage**. Before horizontal scaling, move durable stats/social/feed/moderation data to a shared database and move matchmaking/session state to Redis or another shared realtime store.
