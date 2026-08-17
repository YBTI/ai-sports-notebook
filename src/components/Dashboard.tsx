import React, { useState, useEffect } from "react";
import GoalSetting from "./GoalSetting";
import RoadmapView from "./RoadmapView";
import { RoadmapProvider } from "../context/RoadmapContext";

// Dashboard component now displays a tab bar for "目標設定" and "ロードマップ"

export interface WeeklyGoals {
  studyGoal: string;
  sportsGoal: string;
  studyProgress: number; // 0 - 100
  sportsProgress: number; // 0 - 100
}

export interface DailyLog {
  // 任意のテキスト添え書き
  note?: string;
  // 画像ファイル（必須）
  image?: File;
}

interface DashboardProps {
  goals: WeeklyGoals;
  onUpdateGoals: (newGoals: WeeklyGoals) => void;
  onSubmitNotebook: (log: DailyLog) => void;
  nickname: string;
}
export const Dashboard: React.FC<DashboardProps> = ({
  goals,
  onUpdateGoals,
  onSubmitNotebook,
  nickname,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'roadmap'>('goals');
  // Debug: log activeTab changes
  useEffect(() => {
    console.log('Dashboard activeTab:', activeTab);
  }, [activeTab]);

  return (
    <RoadmapProvider userId={nickname}>
      <div className="dashboard-container">
        {/* Tab navigation */}
        <nav className="dashboard-tab-nav" style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
          <button
            className={activeTab === "goals" ? "active-tab" : "tab"}
            onClick={() => setActiveTab("goals")}
          >
            🎯 目標設定
          </button>
          <button
            className={activeTab === "roadmap" ? "active-tab" : "tab"}
            onClick={() => setActiveTab("roadmap")}
          >
            🗺️ ロードマップ
          </button>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>Current Tab: {activeTab}</div>
        </nav>
        {activeTab === "goals" && (
            <>
              <h2 className="tab-header" style={{ marginBottom: "1rem" }}>目標設定タブ</h2>
              <GoalSetting
                goals={goals}
                onUpdateGoals={onUpdateGoals}
                onSubmitNotebook={onSubmitNotebook}
                nickname={nickname}
              />
            </>
          )}
          {activeTab === "roadmap" && <RoadmapView />}
      </div>
    </RoadmapProvider>
  );
};
export default Dashboard;
