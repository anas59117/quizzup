# QuizzUp social experience

Approved in conversation: persistent friend messaging is the central social experience, followed by targeted challenges, personalized themes and match history, community posts, and polished duel answer exits. Preserve Accueil / Thèmes / Boutique / Profil and the central Jouer action. Preserve the approved dark duel, glacier blue and copper palette, music settings, personal photos and fallback avatars.

## Experience

- Messages entry on Home with real unread count. Mobile conversation list with photo, last message, presence and unread count; searchable friends; persistent thread, composer, timestamps, explicit pending/error/empty states. Open from player profile or a finished match.
- Friend-only challenges in a persistent message card, select theme, accept/decline; authoritative server starts the existing real-time duel only when both players are online and free. Offline invitations are persisted and can be accepted on return; true asynchronous play is a subsequent scoped implementation, never pretend an offline player is playing live.
- Results persist in conversation and personal match history, allow another challenge. No client supplied score is trusted.
- My themes shows followed and recently played themes, levels and actual progress. Follow/unfollow theme persisted. Completion measures distinct correctly answered bank questions; best streak measures consecutive correct answers, both explicitly defined and bounded. Do not display fictional zeroes for missing legacy data.
- Community accessible from Home and each theme, with real posts, optional image, comments, reactions, native share/copy fallback, play theme actions, and playable question posts. Author identity from server. No fabricated people/activity in empty feeds. Report action remains.
- Persistent match history includes opponent photo/name, category, score, outcome and time. Privacy: only owner reads history/messages. Images are validated, bounded HTTP uploads; never increase WS payload cap to carry images.
- Correct answer remains briefly while other answers fade, then existing round transition; no gameplay timer/scoring changes.

## Quality

Pure CSS and existing React18, no new external frontend dependencies. Responsive from320px with44px touch targets, visible focus, reduced motion, safe areas and mobile keyboard support. Real authentication, membership checks, bounded stores, rate limits, predictable reconnect, no destructive migration, no data-volume changes. FR and EN copy supported. Test persistent/reconnect/unread, friend authorization, challenge races, results, history ownership, community inputs and mobile framing. Independent code review, CI production build, then verify deployment before calling it online.
