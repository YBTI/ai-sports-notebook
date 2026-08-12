import React, { useState, useEffect } from "react";
import { ChatMessage, UserSettings } from "../services/gemini";

interface AdminDashboardProps {
  currentSettings: UserSettings;
  currentMessages: ChatMessage[];
  currentGoals: {
    studyGoal: string;
    sportsGoal: string;
    studyProgress: number;
    sportsProgress: number;
  };
  onSendFeedback?: (feedback: {
    studentId: string;
    coachName: string;
    coachRole: string;
    title: string;
    content: string;
    notebookId?: string;
    notebookSnapshot?: any;
  }) => void;
  activeTabProp?: "carte" | "reply" | "ai_log";
}

const API_BASE = "http://localhost:3001";

// 危険ワード検知ロジック
export const checkMessageRisk = (text: string): { isRisk: boolean; reason: string } => {
  const sosWords = ["死にたい", "消えたい", "いじめ", "助けて", "たすけて", "ころす", "死ね", "きえたい"];
  const foundSos = sosWords.find((word) => text.includes(word));
  if (foundSos) {
    return { isRisk: true, reason: `SOS・リスクワード検知: 「${foundSos}」` };
  }

  const phoneRegex = /\d{2,4}-\d{2,4}-\d{3,4}/;
  if (phoneRegex.test(text)) {
    return { isRisk: true, reason: "個人情報保護アラート: 電話番号の可能性" };
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(text)) {
    return { isRisk: true, reason: "個人情報保護アラート: メールアドレスの可能性" };
  }

  return { isRisk: false, reason: "" };
};

interface SubmittedNotebook {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  notebook: {
    studyActivity: string;
    sportsActivity: string;
    studyAchievement: number;
    sportsAchievement: number;
    reflection: string;
  };
  feedback?: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentSettings,
  currentMessages,
  currentGoals,
  onSendFeedback,
  activeTabProp = "carte",
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("current");
  const [notebooks, setNotebooks] = useState<SubmittedNotebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<SubmittedNotebook | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | "risk">("all");

  // フィードバック入力フォーム
  const [coachName, setCoachName] = useState("山田ヘッドコーチ");
  const [coachRole, setCoachRole] = useState("総合指導責任者");
  const [replyTitle, setReplyTitle] = useState("【コーチよりアドバイス】今日のノートを確認しました！");
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");

  // サーバーから提出ノート一覧を取得
  const fetchNotebooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notebooks`);
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data.notebooks || []);
      }
    } catch (e) {
      console.warn("Failed to fetch notebooks from server", e);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, [activeTabProp]);

  // デモ用ユーザーリスト
  const currentUserData = {
    id: "current",
    name: `${currentSettings.nickname} (あなた)`,
    grade: currentSettings.grade === "elementary" ? "小学生" : currentSettings.grade === "junior_high" ? "中学生" : "高校生",
    sport: "野球部・学習両立",
    goals: {
      study: currentGoals.studyGoal,
      sports: currentGoals.sportsGoal,
      studyProgress: currentGoals.studyProgress,
      sportsProgress: currentGoals.sportsProgress,
    },
    messages: currentMessages,
  };

  const demoUsers = [
    currentUserData,
    {
      id: "std-2",
      name: "けんた",
      grade: "中学生（2年）",
      sport: "野球部",
      goals: {
        study: "英語の単語帳 P50〜P60暗記",
        sports: "毎日シャドースイング50回、ランニング3km",
        studyProgress: 75,
        sportsProgress: 90,
      },
      messages: [
        { sender: "user" as const, text: "今日の素振り、100回やりました！", timestamp: "2026-08-11T17:00:00Z" },
        { sender: "ai" as const, text: "素晴らしい！目標の倍も振ったのか！その努力は絶対に裏切らないぞ！明日もこの調子で突き進め！🔥", timestamp: "2026-08-11T17:01:30Z" },
      ],
    },
    {
      id: "std-3",
      name: "はるか",
      grade: "小学生（6年）",
      sport: "陸上部",
      goals: {
        study: "夏休み算数ドリル 終わらせる",
        sports: "毎日ジョギング2km、ストレッチ15分",
        studyProgress: 30,
        sportsProgress: 40,
      },
      messages: [
        { sender: "user" as const, text: "じつは、さいきん学校でいじめられていて、部活にいくのがつらいです。たすけてください。", timestamp: "2026-08-11T18:22:00Z" },
        { sender: "ai" as const, text: "はるかちゃん、つらい気持ちを話してくれてありがとう。それはとても苦しかったね。一人で抱え込まずに、お父さんやお母さん、学校の先生にすぐ相談しようね。", timestamp: "2026-08-11T18:23:00Z" },
      ],
    },
  ];

  const activeUser = demoUsers.find((u) => u.id === selectedUserId) || currentUserData;

  // リスクメッセージ集計
  const riskMessagesList: { userName: string; text: string; reason: string; timestamp: string }[] = [];
  demoUsers.forEach((user) => {
    user.messages.forEach((msg) => {
      const riskCheck = checkMessageRisk(msg.text);
      if (riskCheck.isRisk) {
        riskMessagesList.push({
          userName: user.name,
          text: msg.text,
          reason: riskCheck.reason,
          timestamp: msg.timestamp,
        });
      }
    });
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      alert("フィードバック本文を入力してください！");
      return;
    }

    const targetStudentId = selectedNotebook ? selectedNotebook.studentId : activeUser.id;

    setIsSending(true);
    setSendSuccessMsg("");

    try {
      const payload = {
        studentId: targetStudentId,
        coachName,
        coachRole,
        title: replyTitle,
        content: replyContent,
        notebookId: selectedNotebook?.id,
        notebookSnapshot: selectedNotebook?.notebook,
      };

      if (onSendFeedback) {
        onSendFeedback(payload);
      }

      await fetch(`${API_BASE}/api/feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSendSuccessMsg("✅ 生徒のメールボックスにフィードバックを無事送信しました！");
      setReplyContent("");
      fetchNotebooks();
    } catch (err) {
      alert("送信に失敗しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-column gap-md">
      
      {/* 運営管理者バナー */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "18px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#38bdf8", fontWeight: "700" }}>
              ADMINISTRATION & COACHING
            </span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginTop: "2px" }}>
              👨‍🏫 指導者・管理者ダッシュボード
            </h2>
          </div>
          <span className="admin-badge">コーチ認証済</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "6px" }}>
          {activeTabProp === "carte"
            ? "生徒の情報、学年、部活、週間目標と目標達成進捗率の管理画面です。"
            : activeTabProp === "reply"
            ? "生徒から提出された「スポーツノート」の確認とフィードバック返信用画面です。"
            : "生徒とAIコーチの会話ログ監視およびSOS・リスクキーワード検知画面です。"}
        </p>
      </div>

      {/* SOS・リスクアラート */}
      {riskMessagesList.length > 0 && (
        <div className="risk-alert-banner">
          <span>⚠️ <strong>メンタル・安全リスク検知 ({riskMessagesList.length}件):</strong></span>
          <div className="flex-column" style={{ width: "100%", gap: "6px", marginTop: "8px" }}>
            {riskMessagesList.map((alert, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ef4444",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  color: "#0f172a",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", color: "#ef4444", marginBottom: "4px" }}>
                  <span>{alert.userName}</span>
                  <span>{alert.reason}</span>
                </div>
                <div style={{ fontStyle: "italic", background: "#fef2f2", padding: "6px 10px", borderRadius: "4px" }}>
                  「{alert.text}」
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* タブ 1: 生徒カルテ (carte) */}
      {/* ========================================================= */}
      {activeTabProp === "carte" && (
        <div className="flex-column gap-md">
          
          {/* 生徒選択 */}
          <div className="card">
            <label className="form-label" htmlFor="userSelect">📋 閲覧する生徒を選択してください</label>
            <select
              id="userSelect"
              className="form-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {demoUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  👤 {user.name} ({user.grade}) - {user.sport}
                </option>
              ))}
            </select>
          </div>

          {/* 生徒プロフィール＆目標進捗カルテ */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: "700" }}>STUDENT PROFILE</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  👤 {activeUser.name} のカルテ
                </h3>
              </div>
              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" }}>
                {activeUser.grade}
              </span>
            </div>

            {/* 基本情報 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>部活 / 所属</span>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>
                  🏃 {activeUser.sport}
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>ログイン状態</span>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#10b981", marginTop: "2px" }}>
                  🟢 アプリアクティブ
                </div>
              </div>
            </div>

            {/* 週間目標と進捗バー */}
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px", color: "#334155" }}>
              📊 今週の目標と進捗モニタリング
            </h4>

            {/* 勉強目標 */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1d4ed8" }}>📚 勉強ノルマ</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#1d4ed8" }}>
                  進捗: {activeUser.goals.studyProgress}%
                </span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: "600", marginBottom: "10px" }}>
                {activeUser.goals.study || "目標未設定"}
              </div>
              <div style={{ background: "#dbeafe", borderRadius: "8px", height: "10px", width: "100%", overflow: "hidden" }}>
                <div style={{ background: "#2563eb", height: "100%", width: `${activeUser.goals.studyProgress}%`, transition: "width 0.4s ease" }}></div>
              </div>
            </div>

            {/* スポーツ目標 */}
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#be123c" }}>🏃 スポーツノルマ</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#be123c" }}>
                  進捗: {activeUser.goals.sportsProgress}%
                </span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: "600", marginBottom: "10px" }}>
                {activeUser.goals.sports || "目標未設定"}
              </div>
              <div style={{ background: "#ffe4e6", borderRadius: "8px", height: "10px", width: "100%", overflow: "hidden" }}>
                <div style={{ background: "#e11d48", height: "100%", width: `${activeUser.goals.sportsProgress}%`, transition: "width 0.4s ease" }}></div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* タブ 2: メール返信 / ノート受信 (reply) */}
      {/* ========================================================= */}
      {activeTabProp === "reply" && (
        <div className="flex-column gap-md">
          
          {/* 送信成功通知 */}
          {sendSuccessMsg && (
            <div style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "12px 16px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700" }}>
              {sendSuccessMsg}
            </div>
          )}

          {/* 受信したノート一覧 */}
          <div className="card">
            <h3 className="card-title">📨 生徒から提出されたスポーツノート一覧</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "12px" }}>
              生徒が提出したノートを選択して、アドバイス・フィードバックを記入して送信できます。
            </p>

            {notebooks.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: "30px 0" }}>
                📭 現在、提出されたノートはありません。
              </div>
            ) : (
              <div className="flex-column gap-xs">
                {notebooks.map((nb) => {
                  const isSelected = selectedNotebook?.id === nb.id;
                  return (
                    <div
                      key={nb.id}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                        background: isSelected ? "#f0f9ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => {
                        setSelectedNotebook(nb);
                        setReplyTitle(`【ノート返信】${nb.studentName}選手へコーチからのフィードバック`);
                        setReplyContent(`${nb.studentName}選手、ノート提出ありがとうございます！\n\n【勉強】${nb.notebook.studyActivity || "なし"} (達成度:${nb.notebook.studyAchievement}%)\n【スポーツ】${nb.notebook.sportsActivity || "なし"} (達成度:${nb.notebook.sportsAchievement}%)\n\nしっかり自分の振り返りができていて素晴らしいです。引き続き目標達成に向けて一緒に頑張っていきましょう！`);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div>
                          <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#0f172a" }}>
                            👤 {nb.studentName}
                          </span>
                          {nb.feedback && (
                            <span style={{ background: "#10b981", color: "#fff", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", marginLeft: "8px", fontWeight: "700" }}>
                              返信済み
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {new Date(nb.submittedAt).toLocaleString("ja-JP")}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", gap: "12px" }}>
                        <span>📚 勉強: {nb.notebook.studyActivity || "お休み"}</span>
                        <span>🏃 スポーツ: {nb.notebook.sportsActivity || "お休み"}</span>
                      </div>

                      {nb.notebook.reflection && (
                        <div style={{ fontSize: "0.8rem", fontStyle: "italic", color: "#64748b", marginTop: "4px" }}>
                          「{nb.notebook.reflection}」
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* フィードバック入力・送信フォーム */}
          <div className="card" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0369a1", marginBottom: "12px" }}>
              ✉️ フィードバック作成＆生徒への送信
            </h3>

            <form onSubmit={handleSendReply} className="flex-column gap-sm">
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>差出人コーチ名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>役職・担当</label>
                  <input
                    type="text"
                    className="form-input"
                    value={coachRole}
                    onChange={(e) => setCoachRole(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>送信先の生徒</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedNotebook ? `${selectedNotebook.studentName} 宛` : `${activeUser.name} 宛`}
                  disabled
                  style={{ background: "#e2e8f0", color: "#475569", fontWeight: "700" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>件名</label>
                <input
                  type="text"
                  className="form-input"
                  value={replyTitle}
                  onChange={(e) => setReplyTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>アドバイス・指導メッセージ本文</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "120px", fontSize: "0.9rem" }}
                  placeholder="生徒への励ましや具体的な改善アドバイスを入力してください..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending}
                style={{ padding: "14px", background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)" }}
              >
                {isSending ? "送信中..." : "🚀 生徒のメールボックスにフィードバックを送信！"}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* タブ 3: AIログ / 会話モニタリング (ai_log) */}
      {/* ========================================================= */}
      {activeTabProp === "ai_log" && (
        <div className="flex-column gap-md">
          
          {/* 生徒選択 */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" htmlFor="aiLogUserSelect" style={{ margin: 0 }}>
                💬 AIチャット対話ログを閲覧する生徒
              </label>
              
              {/* ログフィルター */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "12px",
                    background: logFilter === "all" ? "#0284c7" : "#f1f5f9",
                    color: logFilter === "all" ? "#fff" : "#475569",
                  }}
                  onClick={() => setLogFilter("all")}
                >
                  すべて
                </button>
                <button
                  className="btn"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "12px",
                    background: logFilter === "risk" ? "#ef4444" : "#f1f5f9",
                    color: logFilter === "risk" ? "#fff" : "#475569",
                  }}
                  onClick={() => setLogFilter("risk")}
                >
                  ⚠️ リスク検知のみ
                </button>
              </div>
            </div>

            <select
              id="aiLogUserSelect"
              className="form-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {demoUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  👤 {user.name} ({user.messages.length}件の対話)
                </option>
              ))}
            </select>
          </div>

          {/* 対話ログカード */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                💬 {activeUser.name} とAIコーチの会話ログ ({activeUser.messages.length}件)
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>リアルタイム監視中</span>
            </div>

            {activeUser.messages.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: "30px 0" }}>
                対話ログがありません。
              </div>
            ) : (
              <div className="flex-column gap-sm" style={{ maxHeight: "400px", overflowY: "auto", padding: "4px" }}>
                {activeUser.messages
                  .filter((msg) => {
                    if (logFilter === "risk") {
                      return checkMessageRisk(msg.text).isRisk;
                    }
                    return true;
                  })
                  .map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    const riskInfo = checkMessageRisk(msg.text);

                    return (
                      <div
                        key={idx}
                        style={{
                          background: riskInfo.isRisk ? "#fef2f2" : isUser ? "#f8fafc" : "#f0f9ff",
                          border: riskInfo.isRisk ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: isUser ? "#0284c7" : "#0f172a" }}>
                            {isUser ? `👤 生徒 (${activeUser.name})` : "🤖 専属AIコーチ"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.9rem", color: "#1e293b", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                          {msg.text}
                        </div>

                        {riskInfo.isRisk && (
                          <div style={{ marginTop: "8px", background: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                            ⚠️ {riskInfo.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
