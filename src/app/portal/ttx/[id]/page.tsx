"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TtxScenario, TtxStage, TtxQuestion, ScoreUpdateEvent } from "@/types";

interface SessionData {
  id: string;
  status: string;
  mode: string;
  scenario: TtxScenario;
  currentStage: number;
  channelName: string;
  participants: {
    id: string;
    userId: string;
    totalScore: number;
    user: { firstName: string; lastName: string; avatarUrl?: string };
    answers: { stageIndex: number; questionIndex: number; selectedOption: number; isCorrect: boolean; points: number }[];
  }[];
}

export default function TtxPlayPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<Map<string, number>>(new Map());
  const [stageNarrative, setStageNarrative] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreUpdateEvent["leaderboard"]>([]);

  useEffect(() => {
    fetch(`/api/ttx/session/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setCurrentStage(data.currentStage || 0);
        setLoading(false);

        // Rebuild answer history from existing answers
        const history = new Map<string, number>();
        let score = 0;
        data.participants?.forEach((p: SessionData["participants"][0]) => {
          p.answers?.forEach((a) => {
            history.set(`${a.stageIndex}-${a.questionIndex}`, a.selectedOption);
            score += a.points;
          });
        });
        setAnswerHistory(history);
        setMyScore(score);

        if (data.status === "COMPLETED") {
          setSessionComplete(true);
        }
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const scenario = session?.scenario;
  const stage = scenario?.stages?.[currentStage];
  const question = stage?.questions?.[currentQuestion];
  const totalQuestions = scenario?.stages?.reduce((sum, s) => sum + s.questions.length, 0) || 0;
  const answeredCount = answerHistory.size;

  const submitAnswer = useCallback(async () => {
    if (selectedOption === null || !question) return;

    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = question.options[selectedOption]?.isCorrect || false;
    const points = isCorrect ? (correctOption?.points || 0) : 0;

    setAnswered(true);
    setShowExplanation(true);
    setMyScore((prev) => prev + points);
    setAnswerHistory((prev) => new Map(prev).set(`${currentStage}-${currentQuestion}`, selectedOption));

    // Submit to server
    await fetch(`/api/ttx/session/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stageIndex: currentStage,
        questionIndex: currentQuestion,
        selectedOption,
      }),
    });
  }, [selectedOption, question, currentStage, currentQuestion, sessionId]);

  function nextQuestion() {
    setSelectedOption(null);
    setAnswered(false);
    setShowExplanation(false);

    if (stage && currentQuestion < stage.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (scenario && currentStage < scenario.stages.length - 1) {
      setCurrentStage(currentStage + 1);
      setCurrentQuestion(0);
      setStageNarrative(true);
    } else {
      setSessionComplete(true);
      fetch(`/api/ttx/session/${sessionId}/complete`, { method: "POST" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">Exercise not found</p>
      </div>
    );
  }

  // Session complete view
  if (sessionComplete) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-5xl mb-4">🏁</p>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Exercise Complete!</h1>
          <p className="text-gray-400">{scenario.title}</p>
        </div>

        <div className="cyber-card text-center mb-8">
          <p className="text-gray-500 text-sm uppercase tracking-wider">Your Score</p>
          <p className="font-display text-5xl font-bold text-cyber-400 mt-2">{myScore.toLocaleString()}</p>
          <p className="text-gray-500 mt-1">out of {scenario.totalPoints.toLocaleString()} possible</p>
          <div className="mt-4 h-2 bg-surface-3 rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-gradient-to-r from-cyber-600 to-cyber-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.round((myScore / scenario.totalPoints) * 100)}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {Math.round((myScore / scenario.totalPoints) * 100)}% accuracy
          </p>
        </div>

        {/* Stage Breakdown */}
        <div className="cyber-card mb-8">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Stage Breakdown</h2>
          <div className="space-y-3">
            {scenario.stages.map((s, i) => {
              const stageAnswers = Array.from(answerHistory.entries())
                .filter(([key]) => key.startsWith(`${i}-`));
              const stageCorrect = stageAnswers.filter(([key, opt]) => {
                const qIdx = parseInt(key.split("-")[1]);
                return s.questions[qIdx]?.options[opt]?.isCorrect;
              }).length;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
                  <div>
                    <p className="text-white text-sm">{s.title}</p>
                    <p className="text-gray-500 text-xs">{s.mitrePhase}</p>
                  </div>
                  <span className="text-cyber-400 font-mono text-sm">
                    {stageCorrect}/{s.questions.length} correct
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <a href="/portal/leaderboard" className="cyber-btn-secondary">🏆 View Leaderboard</a>
          <a href="/portal/ttx/new" className="cyber-btn-primary">🎯 New Exercise</a>
        </div>
      </div>
    );
  }

  // Stage narrative view
  if (stageNarrative && stage) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Stage {currentStage + 1} of {scenario.stages.length}</span>
            <span>{answeredCount}/{totalQuestions} questions</span>
          </div>
          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyber-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="cyber-card border-cyber-600/30 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyber-600/20 flex items-center justify-center text-cyber-400 font-display font-bold">
              {currentStage + 1}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">{stage.title}</h2>
              <p className="text-gray-500 text-sm">{stage.mitrePhase}</p>
            </div>
          </div>

          {/* MITRE techniques */}
          <div className="flex flex-wrap gap-1 mb-4">
            {stage.mitreTechniques.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-surface-3 rounded text-xs font-mono text-purple-400">{t}</span>
            ))}
          </div>

          {/* Narrative */}
          <div className="prose prose-invert prose-sm max-w-none mb-6">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{stage.narrative}</p>
          </div>

          {/* Alerts */}
          {stage.alertsTriggered && stage.alertsTriggered.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alerts Triggered</h3>
              {stage.alertsTriggered.map((alert, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg border-l-4",
                  alert.severity === "critical" ? "bg-red-500/10 border-red-500" :
                  alert.severity === "high" ? "bg-orange-500/10 border-orange-500" :
                  alert.severity === "medium" ? "bg-yellow-500/10 border-yellow-500" :
                  "bg-green-500/10 border-green-500"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      alert.severity === "critical" ? "text-red-400" :
                      alert.severity === "high" ? "text-orange-400" :
                      alert.severity === "medium" ? "text-yellow-400" :
                      "text-green-400"
                    )}>{alert.severity}</span>
                    <span className="text-gray-500 text-xs">·</span>
                    <span className="text-gray-400 text-xs">{alert.tool}</span>
                  </div>
                  <p className="text-white text-sm font-medium">{alert.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{alert.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* IOCs */}
          {stage.iocIndicators && stage.iocIndicators.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Indicators of Compromise</h3>
              <div className="cyber-terminal text-xs space-y-1">
                {stage.iocIndicators.map((ioc, i) => (
                  <div key={i} className="text-green-400/80">
                    <span className="text-gray-600 mr-2">$</span>{ioc}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setStageNarrative(false)} className="cyber-btn-primary w-full py-3">
          Begin Questions ({stage.questions.length} questions) →
        </button>
      </div>
    );
  }

  // Question view
  if (!question) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{stage?.title}</span>
          <span className="font-mono text-cyber-400">{myScore.toLocaleString()} pts</span>
        </div>
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="cyber-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            "cyber-badge",
            question.difficulty === "easy" ? "bg-green-500/20 text-green-400 border-green-500/30" :
            question.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
            "bg-red-500/20 text-red-400 border-red-500/30"
          )}>
            {question.difficulty}
          </span>
          <span className="text-gray-500 text-xs">
            Q{currentQuestion + 1} of {stage?.questions.length}
          </span>
        </div>

        <h2 className="text-white text-lg font-medium mb-2">{question.question}</h2>

        {question.context && (
          <div className="cyber-terminal text-xs mb-4 whitespace-pre-wrap">{question.context}</div>
        )}

        {/* Options */}
        <div className="space-y-2 mt-6">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.index;
            const showResult = answered;
            const isCorrect = option.isCorrect;

            return (
              <button
                key={option.index}
                onClick={() => !answered && setSelectedOption(option.index)}
                disabled={answered}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  showResult && isCorrect
                    ? "bg-green-500/10 border-green-500 text-white"
                    : showResult && isSelected && !isCorrect
                    ? "bg-red-500/10 border-red-500 text-white"
                    : isSelected
                    ? "bg-cyber-600/15 border-cyber-500 text-white"
                    : "bg-surface-2 border-surface-3 text-gray-300 hover:border-surface-4 hover:bg-surface-3"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                    showResult && isCorrect ? "bg-green-500 text-white" :
                    showResult && isSelected ? "bg-red-500 text-white" :
                    isSelected ? "bg-cyber-600 text-white" :
                    "bg-surface-3 text-gray-400"
                  )}>
                    {showResult && isCorrect ? "✓" : showResult && isSelected ? "✗" : String.fromCharCode(65 + option.index)}
                  </span>
                  <span className="text-sm">{option.text}</span>
                  {showResult && isCorrect && (
                    <span className="ml-auto text-green-400 text-xs font-mono">+{option.points}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="cyber-card bg-surface-0 border-blue-500/20 mb-6 animate-fade-in">
          <h3 className="text-blue-400 font-semibold text-sm mb-2">💡 Explanation</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        {!answered ? (
          <button
            onClick={submitAnswer}
            disabled={selectedOption === null}
            className="cyber-btn-primary w-full py-3 disabled:opacity-50"
          >
            Submit Answer
          </button>
        ) : (
          <button onClick={nextQuestion} className="cyber-btn-primary w-full py-3">
            {stage && currentQuestion < stage.questions.length - 1
              ? "Next Question →"
              : scenario && currentStage < scenario.stages.length - 1
              ? "Next Stage →"
              : "View Results 🏁"}
          </button>
        )}
      </div>
    </div>
  );
}
