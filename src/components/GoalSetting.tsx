import React, { useState } from "react";
import { WeeklyGoals, DailyLog } from "./Dashboard";
import { useRoadmap } from "../context/RoadmapContext";

interface GoalSettingProps {
  goals: WeeklyGoals;
  onUpdateGoals: (newGoals: WeeklyGoals) => void;
  onSubmitNotebook: (log: DailyLog) => void;
  nickname: string;
}

export const GoalSetting: React.FC<GoalSettingProps> = ({ goals, onUpdateGoals, onSubmitNotebook, nickname }) => {
  const { updateGoal } = useRoadmap();
  const [isEditing, setIsEditing] = useState(false);
  const [tempStudyGoal, setTempStudyGoal] = useState(goals.studyGoal);
  const [tempSportsGoal, setTempSportsGoal] = useState(goals.sportsGoal);

  const handleSave = () => {
    onUpdateGoals({
      ...goals,
      studyGoal: tempStudyGoal,
      sportsGoal: tempSportsGoal,
    });
    // Update RoadmapContext with final and near goals (assuming these correspond)
    updateGoal({
      final_goal: tempStudyGoal,
      near_goal: tempSportsGoal,
    });
    setIsEditing(false);
  };

  // Note and image state for notebook submission
  const [note, setNote] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);

  const handleSubmit = () => {
    onSubmitNotebook({ note: note || undefined, image: imageFile });
    setNote("");
    setImageFile(undefined);
  };

  return (
    <div className="flex-column gap-md">
      <div className="highlight-box">
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "4px" }}>
          こんにちは、{nickname || "ゲスト"}選手！
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#475569" }}>
          文武両道を目指して、今日のノートを書いてリアルのコーチ（管理者）に提出しよう！
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            📊 今週の目標と進捗
          </h3>
          <button
            className="btn"
            style={{ width: "auto", padding: "4px 12px", background: "#f1f5f9", color: "#475569", fontSize: "0.8rem" }}
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setTempStudyGoal(goals.studyGoal);
                setTempSportsGoal(goals.sportsGoal);
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "保存" : "編集"}
          </button>
        </div>

        {isEditing ? (
          <div className="flex-column gap-sm" style={{ marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">📚 今週の勉強ノルマ</label>
              <input
                type="text"
                className="form-input"
                value={tempStudyGoal}
                onChange={(e) => setTempStudyGoal(e.target.value)}
                placeholder="例: 数学ワークP10〜P20を解く"
              />
            </div>
            <div className="form-group">
              <label className="form-label">🏃 今週のスポーツノルマ</label>
              <input
                type="text"
                className="form-input"
                value={tempSportsGoal}
                onChange={(e) => setTempSportsGoal(e.target.value)}
                placeholder="例: 毎日素振り100回、ランニング15km"
              />
            </div>
          </div>
        ) : (
          <div className="flex-column gap-sm" style={{ marginBottom: "16px" }}>
            <div className="norma-item study">
              <div>
                <span className="form-label" style={{ fontSize: "0.75rem", margin: 0 }}>
                  📚 勉強ノルマ
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                  {goals.studyGoal || "目標未設定"}
                </span>
              </div>
            </div>
            <div className="norma-item sports">
              <div>
                <span className="form-label" style={{ fontSize: "0.75rem", margin: 0 }}>
                  🏃 スポーツノルマ
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                  {goals.sportsGoal || "目標未設定"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
<div className="card">
  <h3 className="card-title" style={{ margin: 0 }}>📝 ノート提出</h3>
  <div className="form-group" style={{ marginBottom: "8px" }}>
    <label className="form-label">コメント（任意）</label>
    <textarea
      className="form-input"
      rows={3}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="今日のノートや感想を入力"
    />
  </div>
  <div className="form-group" style={{ marginBottom: "8px" }}>
    <label className="form-label">画像アップロード</label>
    <input
      type="file"
      accept="image/*"
      className="form-input"
      onChange={(e) => setImageFile(e.target.files?.[0])}
    />
  </div>
  <button
    className="btn"
    style={{ background: "#f1f5f9", color: "#475569" }}
    onClick={handleSubmit}
    disabled={!imageFile}
  >
    提出する
  </button>
</div>
    </div>
  );
};

export default GoalSetting;
