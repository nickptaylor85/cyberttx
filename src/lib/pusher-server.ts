import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Channel naming convention: private-ttx-{sessionId}
export function getTtxChannel(sessionId: string) {
  return `private-ttx-${sessionId}`;
}

// Event types
export const TTX_EVENTS = {
  // Lobby events
  PLAYER_JOINED: "player-joined",
  PLAYER_LEFT: "player-left",
  SESSION_STARTING: "session-starting",
  
  // Gameplay events
  STAGE_ADVANCE: "stage-advance",
  QUESTION_REVEAL: "question-reveal",
  PLAYER_ANSWERED: "player-answered",
  ALL_ANSWERED: "all-answered",
  SCORE_UPDATE: "score-update",
  
  // Session events
  SESSION_COMPLETED: "session-completed",
  SESSION_CANCELLED: "session-cancelled",
  
  // Timer events
  TIMER_START: "timer-start",
  TIMER_TICK: "timer-tick",
  TIMER_EXPIRED: "timer-expired",
} as const;
