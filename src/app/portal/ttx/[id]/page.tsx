"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SessionData {
  id: string; title: string; theme: string; difficulty: string; mode: string; status: string;
  channelName: string; createdById: string; scenario: any;
  participants: { id: string; userId: string; totalScore: number; rank: number | null;
    user: { id: string; firstName: string; lastName: string };
    answers: { stageIndex: number; questionIndex: number; selectedOption: number; isCorrect: boolean; points: number }[];
  }[];
}

export default function ExercisePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStage, setCurrentStage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [answerHistory, setAnswerHistory] = useState<Map<string, number>>(new Map());
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<{ name: string; id: string }[]>([]);
  const [teamAnswered, setTeamAnswered] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState(false);
  const [joining, setJoining] = useState(false);

  // Fetch session + user info
  const fetchSession = useCallback(async () => {
    try {
      const [sRes, meRes] = await Promise.all([
        fetch(`/api/ttx/session/${sessionId}`),
        fetch("/api/portal/me"),
      ]);
      if (!sRes.ok) throw new Error("Session not found");
      const s = await sRes.json();
      const me = meRes.ok ? await meRes.json() : null;
      setSession(s);
      setMyUserId(me?.id || null);

      // Rebuild answer history
      const history = new Map<string, number>();
      const myParticipant = s.participants?.find((p: any) => p.userId === me?.id);
      myParticipant?.answers?.forEach((a: any) => {
        history.set(`${a.stageIndex}-${a.questionIndex}`, a.selectedOption);
      });
      setAnswerHistory(history);

      // Build lobby players list
      setLobbyPlayers((s.participants || []).map((p: any) => ({
        name: `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.trim() || "Player",
        id: p.userId,
      })));

      // Auto-join if not already in
      if (me?.id && (s.status === "LOBBY" || s.status === "IN_PROGRESS")) {
        const isIn = s.participants?.some((p: any) => p.userId === me.id);
        if (!isIn) {
          await fetch(`/api/ttx/session/${sessionId}/join`, { method: "POST" });
        }
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Pusher real-time subscription
  useEffect(() => {
    if (!session?.channelName || !session?.id) return;
    let channel: any = null;

    async function setupPusher() {
      try {
        const { getPusherClient } = await import("@/lib/pusher-client");
        const pusher = getPusherClient();
        channel = pusher.subscribe(session!.channelName);

        channel.bind("player-joined", (data: any) => {
          setLobbyPlayers(prev => {
            if (prev.some(p => p.id === data.userId)) return prev;
            return [...prev, { name: data.name, id: data.userId }];
          });
        });

        channel.bind("session-starting", () => {
          setSession(prev => prev ? { ...prev, status: "IN_PROGRESS" } : prev);
        });

        channel.bind("player-answered", (data: any) => {
          setTeamAnswered(prev => new Set(prev).add(data.userId));
        });

        channel.bind("session-completed", () => {
          fetchSession();
        });
      } catch {}
    }

    setupPusher();
    return () => { if (channel) channel.unbind_all(); };
  }, [session?.channelName, session?.id, fetchSession]);

  // Start exercise from lobby
  async function startExercise() {
    setStarting(true);
    await fetch(`/api/ttx/session/${sessionId}/start`, { method: "POST" });
    setSession(prev => prev ? { ...prev, status: "IN_PROGRESS" } : prev);
    setStarting(false);
  }

  // Join exercise
  async function joinExercise() {
    setJoining(true);
    await fetch(`/api/ttx/session/${sessionId}/join`, { method: "POST" });
    setJoining(false);
    fetchSession();
  }

  // Answer question
  async function submitAnswer() {
    if (selectedOption === null || !session?.scenario) return;
    setAnswered(true);

    const scenario = session.scenario;
    const stage = scenario.stages?.[currentStage];
    const question = stage?.questions?.[currentQuestion];
    const option = question?.options?.[selectedOption];

    setResult({ isCorrect: option?.isCorrect, points: option?.points || 0, explanation: question?.explanation });

    // Send to API
    await fetch(`/api/ttx/session/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIndex: currentStage, questionIndex: currentQuestion, selectedOption }),
    });

    setAnswerHistory(prev => new Map(prev).set(`${currentStage}-${currentQuestion}`, selectedOption));
    setTeamAnswered(new Set());
  }

  // Navigation
  function nextQuestion() {
    const scenario = session!.scenario;
    const stage = scenario.stages[currentStage];
    if (currentQuestion < stage.questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else if (currentStage < scenario.stages.length - 1) {
      setCurrentStage(s => s + 1);
      setCurrentQuestion(0);
    } else {
      completeExercise();
      return;
    }
    setSelectedOption(null); setAnswered(false); setResult(null);
  }

  async function completeExercise() {
    await fetch(`/api/ttx/session/${sessionId}/complete`, { method: "POST" });
    fetchSession();
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="relative flex h-4 w-4"><span className="animate-ping absolute h-full w-full rounded-full bg-cyber-400 opacity-75"></span><span className="relative rounded-full h-4 w-4 bg-cyber-500"></span></div></div>;
  if (error) return <div className="text-center py-20"><p className="text-red-400">{error}</p><Link href="/portal/ttx" className="text-cyber-400 text-sm">← Back to exercises</Link></div>;
  if (!session) return null;

  const scenario = session.scenario;
  const isCreator = myUserId === session.createdById;
  const isParticipant = session.participants.some(p => p.userId === myUserId);
  const isGroup = session.mode === "GROUP";

  // ═══ COMPLETED STATE ═══
  if (session.status === "COMPLETED") {
    const myParticipant = session.participants.find(p => p.userId === myUserId);
    const correct = myParticipant?.answers?.filter(a => a.isCorrect).length || 0;
    const total = myParticipant?.answers?.length || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const sorted = [...session.participants].sort((a, b) => b.totalScore - a.totalScore);

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-xl font-bold text-white mb-2">{session.title}</h1>
        <p className="text-gray-500 text-sm mb-6">Exercise Complete</p>

        {/* Scoreboard */}
        <div className="cyber-card mb-4">
          <h2 className="text-white text-sm font-semibold mb-3">Scoreboard</h2>
          <div className="space-y-2">{sorted.map((p, i) => {
            const pCorrect = p.answers?.filter(a => a.isCorrect).length || 0;
            const pTotal = p.answers?.length || 0;
            const pAcc = pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0;
            const isMe = p.userId === myUserId;
            return (
              <div key={p.id} className={`flex items-center justify-between py-2 px-3 rounded ${isMe ? "bg-cyber-600/10 border border-cyber-600/20" : "border-b border-surface-3/30"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <div>
                    <p className={`text-sm font-medium ${isMe ? "text-cyber-400" : "text-white"}`}>{p.user?.firstName} {p.user?.lastName}{isMe ? " (you)" : ""}</p>
                    <p className="text-gray-500 text-xs">{pCorrect}/{pTotal} correct</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${pAcc >= 70 ? "text-green-400" : pAcc >= 40 ? "text-yellow-400" : "text-red-400"}`}>{pAcc}%</p>
                  <p className="text-gray-500 text-xs">{p.totalScore} pts</p>
                </div>
              </div>
            );
          })}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/portal/ttx/${sessionId}/replay`} className="cyber-btn-secondary text-sm">🔄 Replay</Link>
          <a href={`/api/portal/certificate?sessionId=${sessionId}`} target="_blank" className="cyber-btn-secondary text-sm">🏆 Certificate</a>
          <a href={`/api/portal/report?sessionId=${sessionId}`} target="_blank" className="cyber-btn-secondary text-sm">📄 Report</a>
          <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm">🎯 New Exercise</Link>
        </div>
      </div>
    );
  }

  // ═══ LOBBY STATE (Group mode) ═══
  if (session.status === "LOBBY") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="font-display text-xl font-bold text-white mb-2">{session.title}</h1>
        <p className="text-gray-500 text-sm mb-6">{session.theme} · {session.difficulty} · Group Exercise</p>

        <div className="cyber-card mb-4">
          <h2 className="text-white text-sm font-semibold mb-3">Waiting Room</h2>
          <p className="text-gray-500 text-xs mb-4">Share this page with your team. When everyone has joined, the creator starts the exercise.</p>

          <div className="space-y-2 mb-4">{lobbyPlayers.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-surface-0 border border-surface-3">
              <div className="w-7 h-7 rounded-full bg-cyber-600/20 flex items-center justify-center text-cyber-400 text-xs font-bold">{p.name[0]?.toUpperCase()}</div>
              <span className="text-white text-sm">{p.name}</span>
              {p.id === session.createdById && <span className="cyber-badge text-xs bg-purple-500/20 text-purple-400 ml-auto">Host</span>}
              <span className="w-2 h-2 rounded-full bg-green-400 ml-auto flex-shrink-0"></span>
            </div>
          ))}</div>

          {!isParticipant && (
            <button onClick={joinExercise} disabled={joining} className="cyber-btn-primary w-full mb-3 disabled:opacity-50">{joining ? "Joining..." : "Join Exercise"}</button>
          )}

          {isCreator && (
            <button onClick={startExercise} disabled={starting || lobbyPlayers.length < 1} className="cyber-btn-primary w-full py-3 text-base disabled:opacity-50">
              {starting ? "Starting..." : `Start Exercise (${lobbyPlayers.length} player${lobbyPlayers.length !== 1 ? "s" : ""})`}
            </button>
          )}

          {!isCreator && isParticipant && (
            <p className="text-gray-500 text-xs mt-2">Waiting for the host to start...</p>
          )}
        </div>

        <div className="cyber-card bg-surface-0/50 text-left">
          <p className="text-gray-500 text-xs"><strong className="text-gray-400">Share link:</strong></p>
          <p className="text-cyber-400 text-xs font-mono mt-1 select-all break-all">https://threatcast.io/portal/ttx/{sessionId}</p>
        </div>
      </div>
    );
  }

  // ═══ IN PROGRESS — GAMEPLAY ═══
  if (!scenario?.stages) return <p className="text-red-400 text-center py-20">No scenario data</p>;

  const stage = scenario.stages[currentStage];
  const question = stage?.questions?.[currentQuestion];
  const totalQuestions = scenario.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0);
  const answeredCount = answerHistory.size;
  const isLastQuestion = currentStage === scenario.stages.length - 1 && currentQuestion === stage.questions.length - 1;
  const alreadyAnswered = answerHistory.has(`${currentStage}-${currentQuestion}`);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-lg font-bold text-white">{session.title}</h1><p className="text-gray-500 text-xs">{session.theme} · {session.difficulty}</p></div>
        <div className="text-right">
          <p className="text-cyber-400 font-mono text-sm font-bold">{answeredCount}/{totalQuestions}</p>
          {isGroup && <p className="text-gray-500 text-xs">{lobbyPlayers.length} players</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-3 rounded-full mb-6"><div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} /></div>

      {/* Team players strip (group mode) */}
      {isGroup && lobbyPlayers.length > 1 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">{lobbyPlayers.map(p => (
          <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${teamAnswered.has(p.id) ? "bg-green-500/10 text-green-400" : "bg-surface-0 text-gray-400"} border border-surface-3`}>
            <span className={`w-1.5 h-1.5 rounded-full ${teamAnswered.has(p.id) ? "bg-green-400" : "bg-gray-600"}`} />
            {p.name.split(" ")[0]}
          </div>
        ))}</div>
      )}

      {/* Stage narrative */}
      <div className="cyber-card mb-4 border-l-2 border-l-cyber-600/30">
        <p className="text-cyber-400 text-xs font-semibold mb-1">Stage {currentStage + 1}: {stage.title}</p>
        <p className="text-gray-400 text-sm leading-relaxed">{stage.narrative}</p>
      </div>

      {/* Question */}
      {question && !alreadyAnswered ? (
        <div className="cyber-card">
          <p className="text-white text-sm font-medium mb-4">{question.question}</p>
          {question.context && <div className="bg-surface-0 border border-surface-3 rounded-lg p-3 mb-4 font-mono text-xs text-gray-400 whitespace-pre-wrap">{question.context}</div>}

          <div className="space-y-2 mb-4">{question.options.map((opt: any, i: number) => (
            <button key={i} onClick={() => { if (!answered) setSelectedOption(i); }}
              disabled={answered}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                answered && opt.isCorrect ? "bg-green-500/10 border-green-500/30 text-green-300" :
                answered && selectedOption === i && !opt.isCorrect ? "bg-red-500/10 border-red-500/30 text-red-300" :
                selectedOption === i ? "bg-cyber-600/15 border-cyber-500 text-white" :
                "bg-surface-0 border-surface-3 text-gray-400 hover:border-surface-4"
              }`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}</span>
              {typeof opt === "string" ? opt : opt.text}
              {answered && opt.isCorrect && <span className="float-right text-green-400">✓</span>}
              {answered && selectedOption === i && !opt.isCorrect && <span className="float-right text-red-400">✗</span>}
            </button>
          ))}</div>

          {!answered ? (
            <button onClick={submitAnswer} disabled={selectedOption === null} className="cyber-btn-primary w-full disabled:opacity-50">Submit Answer</button>
          ) : (
            <div>
              {result && (
                <div className={`p-3 rounded-lg mb-3 ${result.isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <p className={`text-sm font-semibold ${result.isCorrect ? "text-green-400" : "text-red-400"}`}>{result.isCorrect ? `Correct! +${result.points} points` : "Incorrect"}</p>
                  {result.explanation && <p className="text-gray-400 text-xs mt-1">{result.explanation}</p>}
                </div>
              )}
              <button onClick={nextQuestion} className="cyber-btn-primary w-full">{isLastQuestion ? "Complete Exercise" : "Next Question →"}</button>
            </div>
          )}
        </div>
      ) : alreadyAnswered ? (
        <div className="cyber-card text-center py-6">
          <p className="text-gray-400 text-sm">Already answered</p>
          <button onClick={nextQuestion} className="cyber-btn-primary text-sm mt-3">{isLastQuestion ? "Complete Exercise" : "Next Question →"}</button>
        </div>
      ) : null}
    </div>
  );
}
