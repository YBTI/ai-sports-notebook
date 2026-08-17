import React, { useState } from "react";
import { useRoadmap } from "../context/RoadmapContext";
import "./RoadmapView.css";

export const RoadmapView: React.FC = () => {
  const { goal, milestones, refresh, completeMilestone } = useRoadmap();
  const [completingId, setCompletingId] = useState<string | null>(null);

  if (!goal) {
    return (
      <div className="roadmap-empty" style={{ padding: "2rem", textAlign: "center" }}>
        <p>目標が設定されていません。先に「ノート」タブで目標を設定してください。</p>
      </div>
    );
  }

  // 実行中タスクと完了タスクに自動分類
  const activeMilestones = milestones.filter((ms) => !ms.is_completed);
  const completedMilestones = milestones.filter((ms) => ms.is_completed);

  // 完了ボタンハンドラー（スライドアニメーション後にステート更新）
  const handleCompleteClick = (id: string) => {
    if (completingId) return; // 連続クリック防止
    setCompletingId(id);
    setTimeout(async () => {
      await completeMilestone(id);
      setCompletingId(null);
    }, 400); // CSSアニメーション時間に合わせて実行
  };

  return (
    <div className="roadmap-container">
      <h2 className="roadmap-title">🗺️ {goal.final_goal}</h2>
      <p className="roadmap-subtitle">🎯 直近目標: {goal.near_goal}</p>

      {/* ---------------- 🏃 実行中のタスク ---------------- */}
      <div className="roadmap-section-title active-title">
        <span>🏃 実行中のタスク</span>
        <span className="roadmap-badge-count">{activeMilestones.length}件</span>
      </div>

      <div className="milestone-list">
        {activeMilestones.length === 0 ? (
          <div className="roadmap-empty-section">
            🎉 現在実行中のタスクはありません！素晴らしい達成度です！
          </div>
        ) : (
          activeMilestones.map((ms) => {
            const isAnimatingOut = completingId === ms.id;
            return (
              <div
                key={ms.id}
                className={`milestone-card active-card ${isAnimatingOut ? "slide-out-completed" : ""}`}
              >
                <div className="milestone-header">
                  <span className="milestone-step">Step {ms.step_number}</span>
                  <button
                    className="milestone-complete-btn"
                    disabled={isAnimatingOut}
                    onClick={() => handleCompleteClick(ms.id)}
                  >
                    {isAnimatingOut ? "処理中..." : "✅ 完了にする"}
                  </button>
                </div>
                <h3 className="milestone-title">{ms.title}</h3>
                <p className="milestone-desc">{ms.description}</p>
                {ms.advice && <p className="milestone-advice">💡 {ms.advice}</p>}
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- 🎉 完了したタスク ---------------- */}
      <div className="roadmap-section-title completed-title">
        <span>🎉 完了したタスク</span>
        <span className="roadmap-badge-count">{completedMilestones.length}件</span>
      </div>

      <div className="milestone-list">
        {completedMilestones.length === 0 ? (
          <div className="roadmap-empty-section">
            まだ完了したタスクはありません。実行中のタスクをクリアしていきましょう！
          </div>
        ) : (
          completedMilestones.map((ms) => (
            <div key={ms.id} className="milestone-card completed-card">
              <div className="milestone-header">
                <span className="milestone-step">Step {ms.step_number}</span>
                <button className="milestone-complete-btn" disabled>
                  ✅ 完了済
                </button>
              </div>
              <h3 className="milestone-title">{ms.title}</h3>
              <p className="milestone-desc">{ms.description}</p>
              {ms.advice && <p className="milestone-advice">💡 {ms.advice}</p>}
            </div>
          ))
        )}
      </div>

      <button className="roadmap-refresh" onClick={refresh}>🔄 再読み込み</button>
    </div>
  );
};

export default RoadmapView;
