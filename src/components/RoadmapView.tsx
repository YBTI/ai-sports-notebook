import React from "react";
import { useRoadmap } from "../context/RoadmapContext";
import "./RoadmapView.css";

export const RoadmapView: React.FC = () => {
  const { goal, milestones, refresh, completeMilestone } = useRoadmap();

  if (!goal) {
    return (
      <div className="roadmap-empty">
        <p>目標が設定されていません。先に「ノート」タブで目標を設定してください。</p>
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      <h2 className="roadmap-title">🗺️ {goal.final_goal}</h2>
      <p className="roadmap-subtitle">直近目標: {goal.near_goal}</p>

      <div className="milestone-list">
        {milestones.map((ms) => (
          <div key={ms.id} className="milestone-card">
            <div className="milestone-header">
              <span className="milestone-step">Step {ms.step_number}</span>
              <button
                className="milestone-complete-btn"
                disabled={ms.is_completed}
                onClick={() => completeMilestone(ms.id)}
              >
                {ms.is_completed ? "✅ 完了" : "完了にする"}
              </button>
            </div>
            <h3 className="milestone-title">{ms.title}</h3>
            <p className="milestone-desc">{ms.description}</p>
            {ms.advice && <p className="milestone-advice">💡 {ms.advice}</p>}
          </div>
        ))}
      </div>

      <button className="roadmap-refresh" onClick={refresh}>🔄 再読み込み</button>
    </div>
  );
};

export default RoadmapView;
