import React, { useState } from "react";

export interface WeeklyGoals {
  studyGoal: string;
  sportsGoal: string;
  studyProgress: number; // 0 - 100
  sportsProgress: number; // 0 - 100
}

export interface DailyLog {
  studyActivity: string;
  sportsActivity: string;
  studyAchievement: number;
  sportsAchievement: number;
  reflection: string;
}

interface DashboardProps {
  goals: WeeklyGoals;
  onUpdateGoals: (newGoals: WeeklyGoals) => void;
  onSubmitNotebook: (log: DailyLog, textForChat: string) => void;
  nickname: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  goals,
  onUpdateGoals,
  onSubmitNotebook,
  nickname,
}) => {
  // 週間目標設定の編集モード
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempStudyGoal, setTempStudyGoal] = useState(goals.studyGoal);
  const [tempSportsGoal, setTempSportsGoal] = useState(goals.sportsGoal);

  // 今日のログ入力フォーム
  const [studyActivity, setStudyActivity] = useState("");
  const [sportsActivity, setSportsActivity] = useState("");
  const [studyAchievement, setStudyAchievement] = useState(80);
  const [sportsAchievement, setSportsAchievement] = useState(80);
  const [reflection, setReflection] = useState("");

  const handleSaveGoals = () => {
    onUpdateGoals({
      ...goals,
      studyGoal: tempStudyGoal,
      sportsGoal: tempSportsGoal,
    });
    setIsEditingGoals(false);
  };

  const handleNotebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyActivity.trim() && !sportsActivity.trim()) {
      alert("勉強かスポーツのどちらかの活動記録を入力してください！");
      return;
    }

// リアルのコーチ（管理者）に提出するための整形テキスト
    const chatText = `📖 【今日のスポーツノート提出】 📖
    
[勉強の活動]
・メニュー: ${studyActivity || "お休み"}
・達成度: ${studyActivity ? `${studyAchievement}%` : "-"}

[スポーツの活動]
・メニュー: ${sportsActivity || "お休み"}
・達成度: ${sportsActivity ? `${sportsAchievement}%` : "-"}

[今日の振り返り]
${reflection || "特になし"}

※リアルのコーチ（管理者）宛てにノートを提出しました。フィードバックはメールボックスに届きます。`;

    const log: DailyLog = {
      studyActivity,
      sportsActivity,
      studyAchievement: studyActivity ? studyAchievement : 0,
      sportsAchievement: sportsActivity ? sportsAchievement : 0,
      reflection,
    };

    // ノートの提出処理（親コンポーネントでメッセージの追加とAIの応答起動を行う）
    onSubmitNotebook(log, chatText);

    // フォームをクリア
    setStudyActivity("");
    setSportsActivity("");
    setStudyAchievement(80);
    setSportsAchievement(80);
    setReflection("");

    // 送信後の通知（親がタブ切り替えを制御する）
  };

  // SVG円形プログレスバー描画用パラメータ
  const renderProgressCircle = (percent: number, type: "study" | "sports") => {
    const size = 80;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <svg width={size} height={size} className="progress-circle">
        <circle
          className="progress-circle-bg"
          cx={center}
          cy={center}
          r={radius}
        />
        <circle
          className={`progress-circle-bar ${type}`}
          cx={center}
          cy={center}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    );
  };

  return (
    <div className="flex-column gap-md">
      
      {/* ウェルカムバナー */}
      <div className="highlight-box">
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "4px" }}>
          こんにちは、{nickname || "ゲスト"}選手！
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#475569" }}>
          文武両道を目指して、今日のノートを書いてリアルのコーチ（管理者）に提出しよう！
        </p>
      </div>

      {/* 週間目標と進捗 */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>📊 今週の目標と進捗</h3>
          <button
            className="btn"
            style={{ width: "auto", padding: "4px 12px", background: "#f1f5f9", color: "#475569", fontSize: "0.8rem" }}
            onClick={() => {
              if (isEditingGoals) {
                handleSaveGoals();
              } else {
                setTempStudyGoal(goals.studyGoal);
                setTempSportsGoal(goals.sportsGoal);
                setIsEditingGoals(true);
              }
            }}
          >
            {isEditingGoals ? "保存" : "編集"}
          </button>
        </div>

        {isEditingGoals ? (
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
                <span className="form-label" style={{ fontSize: "0.75rem", margin: 0 }}>📚 勉強ノルマ</span>
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{goals.studyGoal || "目標未設定"}</span>
              </div>
            </div>
            <div className="norma-item sports">
              <div>
                <span className="form-label" style={{ fontSize: "0.75rem", margin: 0 }}>🏃 スポーツノルマ</span>
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{goals.sportsGoal || "目標未設定"}</span>
              </div>
            </div>
          </div>
        )}

        <div className="progress-section">
          
          <div className="progress-card">
            <div className="progress-circle-container">
              {renderProgressCircle(goals.studyProgress, "study")}
              <div className="progress-percentage">{goals.studyProgress}%</div>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-secondary)" }}>勉強の進捗</span>
            <input
              type="range"
              min="0"
              max="100"
              value={goals.studyProgress}
              onChange={(e) =>
                onUpdateGoals({ ...goals, studyProgress: parseInt(e.target.value) })
              }
              style={{ width: "100%", marginTop: "10px", accentColor: "var(--color-secondary)" }}
            />
          </div>

          <div className="progress-card">
            <div className="progress-circle-container">
              {renderProgressCircle(goals.sportsProgress, "sports")}
              <div className="progress-percentage">{goals.sportsProgress}%</div>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-primary)" }}>スポーツの進捗</span>
            <input
              type="range"
              min="0"
              max="100"
              value={goals.sportsProgress}
              onChange={(e) =>
                onUpdateGoals({ ...goals, sportsProgress: parseInt(e.target.value) })
              }
              style={{ width: "100%", marginTop: "10px", accentColor: "var(--color-primary)" }}
            />
          </div>

        </div>
      </div>

      {/* 今日のノート入力 */}
      <div className="card">
        <h3 className="card-title">📝 今日のスポーツノートをリアルコーチに提出する</h3>
        <form onSubmit={handleNotebookSubmit} className="flex-column gap-sm">
          
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", background: "var(--color-secondary-light)" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-secondary)", display: "block", marginBottom: "8px" }}>
              📖 勉強の記録
            </span>
            <div className="form-group">
              <label className="form-label" htmlFor="studyActivity">やったこと</label>
              <input
                id="studyActivity"
                type="text"
                className="form-input"
                placeholder="例: 英語の単語練習、数学ワークP15"
                value={studyActivity}
                onChange={(e) => setStudyActivity(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">自己達成度: {studyAchievement}%</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={studyAchievement}
                onChange={(e) => setStudyAchievement(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-secondary)" }}
              />
            </div>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", background: "var(--color-primary-light)" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-primary)", display: "block", marginBottom: "8px" }}>
              🏃 スポーツ練習の記録
            </span>
            <div className="form-group">
              <label className="form-label" htmlFor="sportsActivity">やったこと</label>
              <input
                id="sportsActivity"
                type="text"
                className="form-input"
                placeholder="例: 素振り100回、シュート練習30分"
                value={sportsActivity}
                onChange={(e) => setSportsActivity(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">自己達成度: {sportsAchievement}%</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={sportsAchievement}
                onChange={(e) => setSportsAchievement(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-primary)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reflection">💬 今日のひとこと振り返り</label>
            <textarea
              id="reflection"
              className="form-textarea"
              placeholder="今日の良かった点、悪かった点、明日に向けた意気込みなど"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: "14px" }}>
            🚀 リアルのコーチにノートを提出する！
          </button>

        </form>
      </div>

    </div>
  );
};
export default Dashboard;
