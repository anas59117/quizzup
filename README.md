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
