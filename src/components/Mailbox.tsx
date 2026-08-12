import React, { useState } from "react";

export interface CoachFeedback {
  id: string;
  date: string;
  coachName: string;
  coachRole: string; // 例: "部活ヘッドコーチ", "学習チーフアドバイザー"
  title: string;
  content: string;
  notebookSnapshot?: {
    date: string;
    studyActivity: string;
    sportsActivity: string;
    reflection: string;
  };
  isRead: boolean;
  isSaved?: boolean;
}

interface MailboxProps {
  feedbacks: CoachFeedback[];
  onMarkAsRead: (id: string) => void;
  onToggleSave: (id: string) => void;
  nickname: string;
}

export const Mailbox: React.FC<MailboxProps> = ({
  feedbacks,
  onMarkAsRead,
  onToggleSave,
  nickname,
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<CoachFeedback | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "saved">("all");

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filter === "unread") return !fb.isRead;
    if (filter === "saved") return fb.isSaved;
    return true;
  });

  const unreadCount = feedbacks.filter((fb) => !fb.isRead).length;

  const handleOpenDetail = (fb: CoachFeedback) => {
    setSelectedFeedback(fb);
    if (!fb.isRead) {
      onMarkAsRead(fb.id);
    }
  };

  return (
    <div className="flex-column gap-md">
      
      {/* 画面ヘッダー */}
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#38bdf8", fontWeight: "700" }}>
              COACH FEEDBACK
            </span>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginTop: "2px" }}>
              📬 コーチ便り（メールボックス）
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
              提出したノートに対するリアルコーチからのアドバイス・フィードバックが届きます。
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.8rem" }}>📩</span>
            {unreadCount > 0 && (
              <div style={{ background: "#ef4444", color: "#fff", fontSize: "0.75rem", fontWeight: "800", borderRadius: "12px", padding: "2px 8px", marginTop: "2px" }}>
                未読 {unreadCount} 件
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フィルタータブ */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>
        <button
          className={`btn ${filter === "all" ? "btn-primary" : ""}`}
          style={{ width: "auto", padding: "6px 14px", fontSize: "0.85rem", borderRadius: "20px", background: filter !== "all" ? "#f1f5f9" : undefined, color: filter !== "all" ? "#475569" : undefined }}
          onClick={() => setFilter("all")}
        >
          すべて ({feedbacks.length})
        </button>
        <button
          className={`btn ${filter === "unread" ? "btn-primary" : ""}`}
          style={{ width: "auto", padding: "6px 14px", fontSize: "0.85rem", borderRadius: "20px", background: filter !== "unread" ? "#f1f5f9" : undefined, color: filter !== "unread" ? "#475569" : undefined }}
          onClick={() => setFilter("unread")}
        >
          未読 ({unreadCount})
        </button>
        <button
          className={`btn ${filter === "saved" ? "btn-primary" : ""}`}
          style={{ width: "auto", padding: "6px 14px", fontSize: "0.85rem", borderRadius: "20px", background: filter !== "saved" ? "#f1f5f9" : undefined, color: filter !== "saved" ? "#475569" : undefined }}
          onClick={() => setFilter("saved")}
        >
          ⭐ 記録保存 ({feedbacks.filter(f => f.isSaved).length})
        </button>
      </div>

      {/* メール一覧 */}
      {filteredFeedbacks.length === 0 ? (
        <div className="card text-center" style={{ padding: "40px 20px", color: "#64748b" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "12px" }}>📭</span>
          <p style={{ fontWeight: "600" }}>該当するフィードバックメールはありません。</p>
          <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>
            「ノート」から今日の活動を提出すると、リアルコーチからのアドバイスがここに届きます！
          </p>
        </div>
      ) : (
        <div className="flex-column gap-sm">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`card ${!fb.isRead ? "unread-mail" : ""}`}
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderLeft: !fb.isRead ? "4px solid #0284c7" : "1px solid #e2e8f0",
                background: !fb.isRead ? "#f0f9ff" : "#ffffff",
                position: "relative",
              }}
              onClick={() => handleOpenDetail(fb)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {!fb.isRead && (
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284c7", display: "inline-block" }} />
                  )}
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#0284c7" }}>
                    👨‍🏫 {fb.coachName} ({fb.coachRole})
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{fb.date}</span>
              </div>

              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                {fb.title}
              </h3>

              <p style={{
                fontSize: "0.85rem",
                color: "#475569",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                margin: 0,
              }}>
                {fb.content}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {fb.notebookSnapshot ? "📝 提出ノート参照あり" : "📢 一般アドバイス"}
                </span>
                <button
                  className="btn-icon"
                  style={{ fontSize: "1rem", color: fb.isSaved ? "#eab308" : "#cbd5e1" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(fb.id);
                  }}
                  title={fb.isSaved ? "記録から外す" : "記録として保存する"}
                >
                  {fb.isSaved ? "★ 保存済み" : "☆ 保存"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* メール詳細モーダル */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", width: "92%", maxHeight: "85vh", overflowY: "auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: "700" }}>
                  👨‍🏫 リアルコーチからのフィードバック
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: "2px 0 0 0" }}>
                  {selectedFeedback.title}
                </h3>
              </div>
              <button
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#94a3b8" }}
                onClick={() => setSelectedFeedback(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span>送信者: <strong>{selectedFeedback.coachName}</strong> ({selectedFeedback.coachRole})</span>
              <span>{selectedFeedback.date}</span>
            </div>

            {/* コーチのコメント本文 */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", borderLeft: "4px solid #0284c7", marginBottom: "20px", whiteSpace: "pre-wrap", fontSize: "0.9rem", lineHeight: "1.6", color: "#1e293b" }}>
              {selectedFeedback.content}
            </div>

            {/* 提出されたノートの振り返り参照（存在する場合） */}
            {selectedFeedback.notebookSnapshot && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>
                  📋 提出したノートの内容 ({selectedFeedback.notebookSnapshot.date})
                </span>
                <div style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div><strong>📚 勉強:</strong> {selectedFeedback.notebookSnapshot.studyActivity || "なし"}</div>
                  <div><strong>🏃 スポーツ:</strong> {selectedFeedback.notebookSnapshot.sportsActivity || "なし"}</div>
                  <div><strong>💬 今日の振り返り:</strong> {selectedFeedback.notebookSnapshot.reflection || "なし"}</div>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn"
                style={{
                  width: "auto",
                  padding: "8px 16px",
                  background: selectedFeedback.isSaved ? "#fef08a" : "#f1f5f9",
                  color: selectedFeedback.isSaved ? "#854d0e" : "#475569",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                }}
                onClick={() => {
                  onToggleSave(selectedFeedback.id);
                  setSelectedFeedback({
                    ...selectedFeedback,
                    isSaved: !selectedFeedback.isSaved,
                  });
                }}
              >
                {selectedFeedback.isSaved ? "★ 記録ノートに保存中" : "⭐ 大切なアドバイスとして記録"}
              </button>
              <button
                className="btn btn-primary"
                style={{ width: "auto", padding: "8px 20px", fontSize: "0.85rem" }}
                onClick={() => setSelectedFeedback(null)}
              >
                閉じる
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Mailbox;
