import React from 'react';
import { Trophy, Target, Zap, TrendingUp, RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { HeatmapChart } from '../Charts/HeatmapChart';
import { ProgressBar } from '../UI/ProgressBar';
import { useSessionStore } from '../../store/sessionStore';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';

function getGrade(accuracy: number, score: number): { grade: string; color: string } {
  if (accuracy >= 0.95 && score > 5000) return { grade: 'S', color: '#FFB800' };
  if (accuracy >= 0.85) return { grade: 'A', color: '#00FF88' };
  if (accuracy >= 0.70) return { grade: 'B', color: '#6C63FF' };
  if (accuracy >= 0.55) return { grade: 'C', color: '#00D4FF' };
  return { grade: 'D', color: '#FF4444' };
}

export const SessionResults: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession } = useSessionStore();
  const { mode, difficulty, config, startCountdown, setMode } = useGameStore();
  const { recommendations } = usePlayerStore();

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">No session data</div>
      </div>
    );
  }

  const { metrics, score, recommendations: sessionRecs } = currentSession;
  const { grade, color } = getGrade(metrics.accuracy, score);
  const displayRecs = sessionRecs.length > 0 ? sessionRecs : recommendations;

  const accuracyPct = Math.round(metrics.accuracy * 100);
  const xpGained = Math.round(score / 10 + metrics.accuracy * 50);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Session Complete</h2>
            <p className="text-text-muted capitalize">{mode} mode · {difficulty} · {config.duration}s</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="primary" size="sm" onClick={() => startCountdown()}>
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Grade + Score */}
          <div className="col-span-3">
            <Card className="flex flex-col items-center justify-center py-8 h-full">
              <div
                className="text-7xl font-black mb-2"
                style={{ color, textShadow: `0 0 30px ${color}60` }}
              >
                {grade}
              </div>
              <div className="text-sm text-text-muted mb-4">Grade</div>
              <div className="text-3xl font-bold text-text-primary">{score.toLocaleString()}</div>
              <div className="text-xs text-text-muted mt-1">Score</div>
              <div className="mt-4 flex items-center gap-1.5 text-warning text-sm font-semibold">
                <Trophy className="w-4 h-4" />
                +{xpGained} XP
              </div>
            </Card>
          </div>

          {/* Main Stats */}
          <div className="col-span-9 grid grid-cols-3 gap-3">
            {[
              { label: 'Accuracy', value: `${accuracyPct}%`, icon: <Target className="w-4 h-4" />, color: accuracyPct >= 80 ? 'text-success' : accuracyPct >= 60 ? 'text-warning' : 'text-danger' },
              { label: 'Avg Reaction', value: metrics.avgReactionTime > 0 ? `${Math.round(metrics.avgReactionTime)}ms` : 'N/A', icon: <Zap className="w-4 h-4 text-accent2" />, color: 'text-accent2' },
              { label: 'Hits / Shots', value: `${metrics.hits}/${metrics.totalShots}`, icon: <TrendingUp className="w-4 h-4 text-accent" />, color: 'text-text-primary' },
            ].map(stat => (
              <Card key={stat.label} className="flex flex-col items-center justify-center py-5">
                {stat.icon}
                <div className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
              </Card>
            ))}

            {/* Detailed stats */}
            <div className="col-span-3 grid grid-cols-2 gap-3">
              <Card padding="sm">
                <div className="text-xs text-text-muted mb-3 font-semibold uppercase tracking-wider">Aim Analysis</div>
                <div className="space-y-2">
                  {[
                    { label: 'Overshoot Rate', value: `${Math.round(metrics.overshootRate * 100)}%`, good: metrics.overshootRate < 0.25 },
                    { label: 'Undershoot Rate', value: `${Math.round(metrics.undershootRate * 100)}%`, good: metrics.undershootRate < 0.25 },
                    { label: 'Jitter Score', value: metrics.jitterScore.toFixed(1), good: metrics.jitterScore < 2 },
                    { label: 'Smoothness', value: `${Math.round(metrics.smoothnessScore * 100)}%`, good: metrics.smoothnessScore > 0.7 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">{item.label}</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${item.good ? 'text-success' : 'text-warning'}`}>
                        {item.good ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="sm">
                <div className="text-xs text-text-muted mb-3 font-semibold uppercase tracking-wider">Performance</div>
                <div className="space-y-2">
                  {[
                    { label: 'Consistency', value: metrics.consistencyScore, unit: '%', scale: 100 },
                    { label: 'Speed-Accuracy', value: metrics.speedAccuracyBalance, unit: '%', scale: 100 },
                    { label: 'Fatigue Index', value: metrics.fatigueIndex, unit: '%', scale: 100, invert: true },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">{item.label}</span>
                        <span className="text-text-primary">{Math.round(item.value * item.scale)}{item.unit}</span>
                      </div>
                      <ProgressBar
                        value={item.value * 100}
                        color={item.invert ? (item.value < 0.2 ? 'success' : 'warning') : item.value > 0.7 ? 'success' : 'accent'}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Heatmap */}
          <div className="col-span-4">
            <Card>
              <div className="text-sm font-semibold text-text-primary mb-4">Click Heatmap</div>
              <HeatmapChart clickEvents={metrics.clickEvents} size={180} />
            </Card>
          </div>

          {/* Recommendations */}
          <div className="col-span-8">
            <Card>
              <div className="text-sm font-semibold text-text-primary mb-4">AI Recommendations</div>
              {displayRecs.length === 0 ? (
                <div className="text-text-muted text-sm">No specific recommendations for this session.</div>
              ) : (
                <div className="space-y-3">
                  {displayRecs.slice(0, 3).map(rec => (
                    <div key={rec.id} className="bg-bg-surface rounded-lg p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'muted'} size="sm">
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-semibold text-text-primary">{rec.title}</span>
                        </div>
                        <span className="text-xs text-text-muted">{rec.confidence}% confident</span>
                      </div>
                      <p className="text-xs text-text-muted">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
