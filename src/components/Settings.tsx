import React, { useState } from "react";
import { UserSettings } from "../services/gemini";

interface SettingsProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  currentUser?: { name: string; role: "student" | "coach" };
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, currentUser, onLogout }) => {
  const [nickname, setNickname] = useState(settings.nickname);
  const [grade, setGrade] = useState<UserSettings["grade"]>(settings.grade);
  const [characterType, setCharacterType] = useState<UserSettings["characterType"]>(
    settings.characterType
  );
  const [contactMode, setContactMode] = useState<UserSettings["contactMode"]>(
    settings.contactMode
  );
  const [savedMessage, setSavedMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert("ニックネームを入力してください！");
      return;
    }
    
    onSave({
      nickname,
      grade,
      characterType,
      contactMode,
    });

    setSavedMessage("設定を保存しました！✨");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="flex-column gap-md">

      {/* 現在のログインアカウント情報 */}
      <div className="card" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>ログイン中</span>
            <div style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
              {currentUser ? (
                <>
                  {currentUser.role === "student" ? "🎓 生徒" : "👨‍🏫 コーチ"}: {currentUser.name}
                </>
              ) : (
                `🎓 生徒: ${settings.nickname}`
              )}
            </div>
          </div>
          {onLogout && (
            <button
              className="btn"
              style={{ width: "auto", padding: "6px 14px", background: "#fee2e2", color: "#dc2626", fontSize: "0.8rem", fontWeight: "700" }}
              onClick={onLogout}
            >
              🚪 ログアウト
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">⚙️ プロフィール設定</h2>
        <form onSubmit={handleSubmit} className="flex-column gap-sm">
          
          <div className="form-group">
            <label className="form-label" htmlFor="nickname">ニックネーム</label>
            <input
              id="nickname"
              type="text"
              className="form-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: たろう、サクラ"
              maxLength={15}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="grade">学年</label>
            <select
              id="grade"
              className="form-select"
              value={grade}
              onChange={(e) => setGrade(e.target.value as UserSettings["grade"])}
            >
              <option value="elementary">小学生</option>
              <option value="junior_high">中学生</option>
              <option value="high">高校生</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">🤖 専属AIコーチの性格</label>
            <div className="coach-selector">
              
              <div
                className={`coach-option ${characterType === "passionate" ? "selected" : ""}`}
                onClick={() => setCharacterType("passionate")}
              >
                <div className="coach-avatar-lg">🔥</div>
                <div className="coach-name">熱血監督</div>
                <div className="coach-desc">熱い言葉で限界突破をサポート！</div>
              </div>

              <div
                className={`coach-option ${characterType === "gentle" ? "selected" : ""}`}
                onClick={() => setCharacterType("gentle")}
              >
                <div className="coach-avatar-lg">🧸</div>
                <div className="coach-name">寄り添い兄・姉</div>
                <div className="coach-desc">いつでも優しく共感＆サポート！</div>
              </div>

              <div
                className={`coach-option ${characterType === "logical" ? "selected" : ""}`}
                onClick={() => setCharacterType("logical")}
              >
                <div className="coach-avatar-lg">👓</div>
                <div className="coach-name">冷静分析官</div>
                <div className="coach-desc">データに基づき論理的に分析！</div>
              </div>

              <div
                className={`coach-option ${characterType === "friendly" ? "selected" : ""}`}
                onClick={() => setCharacterType("friendly")}
              >
                <div className="coach-avatar-lg">✨</div>
                <div className="coach-name">フレンドリー</div>
                <div className="coach-desc">タメ口で明るく楽しく応援！</div>
              </div>

            </div>
          </div>

          <div className="form-group">
            <label className="form-label">📞 声かけモード（連絡の距離感）</label>
            <div className="mode-selector">
              
              <div
                className={`mode-option ${contactMode === "high_frequency" ? "selected" : ""}`}
                onClick={() => setContactMode("high_frequency")}
              >
                <div className="mode-title">側で支えてほしいモード</div>
                <div className="mode-desc">進捗に関係なく、定期的・高頻度にAIコーチが声かけを行います。</div>
              </div>

              <div
                className={`mode-option ${contactMode === "on_alert" ? "selected" : ""}`}
                onClick={() => setContactMode("on_alert")}
              >
                <div className="mode-title">やばかったら声かけてモード</div>
                <div className="mode-desc">自分で決めたノルマが遅れている時だけ注意・励ましを行います。</div>
              </div>

              <div
                className={`mode-option ${contactMode === "low_frequency" ? "selected" : ""}`}
                onClick={() => setContactMode("low_frequency")}
              >
                <div className="mode-title">見守って欲しいモード</div>
                <div className="mode-desc">ノートの提出時や週末の振り返り時のみ声かけを行います。</div>
              </div>

            </div>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ marginTop: "8px" }}>
            設定を保存する
          </button>

          {savedMessage && (
            <div className="text-center" style={{ color: "var(--color-accent)", fontWeight: "bold", marginTop: "8px" }}>
              {savedMessage}
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
export default Settings;
