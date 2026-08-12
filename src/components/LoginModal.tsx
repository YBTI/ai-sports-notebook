import React, { useState } from "react";
import { UserSettings } from "../services/gemini";

export interface UserAccount {
  id: string;
  name: string;
  role: "student" | "coach";
  grade?: string;
  sport?: string;
  settings?: UserSettings;
}

interface LoginModalProps {
  onLoginStudent: (account: UserAccount, newSettings?: UserSettings) => void;
  onLoginCoach: (account: UserAccount) => void;
}

// 既存デモアカウントの定義
const DEMO_STUDENTS: UserAccount[] = [
  {
    id: "std-1",
    name: "コウタ",
    role: "student",
    grade: "junior_high",
    sport: "部活動（野球・勉学）",
    settings: {
      nickname: "コウタ",
      grade: "junior_high",
      characterType: "passionate",
      contactMode: "high_frequency",
    },
  },
  {
    id: "std-2",
    name: "けんた",
    role: "student",
    grade: "junior_high",
    sport: "野球部",
    settings: {
      nickname: "けんた",
      grade: "junior_high",
      characterType: "friendly",
      contactMode: "high_frequency",
    },
  },
  {
    id: "std-3",
    name: "はるか",
    role: "student",
    grade: "elementary",
    sport: "陸上部",
    settings: {
      nickname: "はるか",
      grade: "elementary",
      characterType: "gentle",
      contactMode: "on_alert",
    },
  },
];

const DEMO_COACHES: UserAccount[] = [
  {
    id: "coach-1",
    name: "山田ヘッドコーチ",
    role: "coach",
    sport: "部活動・生活指導主任",
  },
  {
    id: "coach-2",
    name: "佐藤学習アドバイザー",
    role: "coach",
    sport: "学習・進路チーフアドバイザー",
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginStudent,
  onLoginCoach,
}) => {
  const [activeRole, setActiveRole] = useState<"student" | "coach">("student");
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);

  // 新規生徒登録用フォーム
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState<"elementary" | "junior_high" | "high">("junior_high");
  const [characterType, setCharacterType] = useState<"passionate" | "gentle" | "logical" | "friendly">("passionate");
  const [contactMode, setContactMode] = useState<"high_frequency" | "on_alert" | "low_frequency">("high_frequency");

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert("ニックネームを入力してください！");
      return;
    }

    const newSettings: UserSettings = {
      nickname: nickname.trim(),
      grade,
      characterType,
      contactMode,
    };

    const newAccount: UserAccount = {
      id: `std-new-${Date.now()}`,
      name: nickname.trim(),
      role: "student",
      grade,
      sport: "スポーツ＆勉学",
      settings: newSettings,
    };

    onLoginStudent(newAccount, newSettings);
  };

  return (
    <div className="modal-overlay" style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)" }}>
      <div className="modal-content card" style={{ maxWidth: "460px", width: "92%", padding: "28px 24px" }}>
        
        {/* ロゴ ＆ キャッチコピー */}
        <div className="text-center" style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "2.4rem", display: "block" }}>🏆</span>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
            キソレンモバイル
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            スポーツと勉強の目標達成＆指導者伴走アプリ
          </p>
        </div>

        {/* ロール切替タブ */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px", marginBottom: "20px" }}>
          <button
            className="btn"
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "0.85rem",
              fontWeight: "700",
              borderRadius: "8px",
              background: activeRole === "student" ? "#ffffff" : "transparent",
              color: activeRole === "student" ? "#0284c7" : "#64748b",
              boxShadow: activeRole === "student" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => {
              setActiveRole("student");
              setIsRegisteringNew(false);
            }}
          >
            🎓 生徒（小中高生）
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "0.85rem",
              fontWeight: "700",
              borderRadius: "8px",
              background: activeRole === "coach" ? "#ffffff" : "transparent",
              color: activeRole === "coach" ? "#0f172a" : "#64748b",
              boxShadow: activeRole === "coach" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => setActiveRole("coach")}
          >
            👨‍🏫 コーチ（指導者・管理者）
          </button>
        </div>

        {/* 生徒ログインコンテンツ */}
        {activeRole === "student" && (
          <div>
            {!isRegisteringNew ? (
              <div className="flex-column gap-sm">
                
                {/* 新規登録ボタン */}
                <button
                  className="btn btn-primary"
                  style={{
                    padding: "14px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                  }}
                  onClick={() => setIsRegisteringNew(true)}
                >
                  ✨ 初めて利用する（新規プロフィール登録）
                </button>

                <div style={{ position: "relative", textAlign: "center", margin: "12px 0" }}>
                  <span style={{ background: "#fff", padding: "0 10px", fontSize: "0.75rem", color: "#94a3b8", position: "relative", zIndex: 1 }}>
                    または既存アカウントでログイン
                  </span>
                  <hr style={{ position: "absolute", top: "50%", left: 0, right: 0, border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />
                </div>

                <div className="flex-column gap-xs">
                  {DEMO_STUDENTS.map((std) => (
                    <button
                      key={std.id}
                      className="btn"
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        justifyContent: "space-between",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "0.85rem",
                        color: "#1e293b",
                      }}
                      onClick={() => onLoginStudent(std, std.settings)}
                    >
                      <div>
                        <span style={{ fontWeight: "700" }}>👤 {std.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "8px" }}>
                          ({std.grade === "junior_high" ? "中学生" : std.grade === "elementary" ? "小学生" : "高校生"})
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: "700" }}>ログイン →</span>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* 新規登録フォーム */
              <form onSubmit={handleRegisterSubmit} className="flex-column gap-sm">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#0284c7", fontSize: "0.85rem" }}
                    onClick={() => setIsRegisteringNew(false)}
                  >
                    ← 戻る
                  </button>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                    📝 新規プロフィール登録
                  </h3>
                </div>

                <div className="form-group">
                  <label className="form-label">ニックネーム（呼び名）</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例: たろう、ハナ"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">学年</label>
                  <select
                    className="form-select"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                  >
                    <option value="elementary">小学生</option>
                    <option value="junior_high">中学生</option>
                    <option value="high">高校生</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">専属AIコーチの性格タイプ</label>
                  <select
                    className="form-select"
                    value={characterType}
                    onChange={(e) => setCharacterType(e.target.value as any)}
                  >
                    <option value="passionate">🔥 熱血監督タイプ（熱く力強い言葉）</option>
                    <option value="gentle">🧸 優しく寄り添う兄・姉タイプ（共感・丁寧）</option>
                    <option value="logical">👓 冷静な分析官タイプ（データ・論理的）</option>
                    <option value="friendly">✨ フレンドリーマネージャータイプ（タメ口応援）</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">声かけモード</label>
                  <select
                    className="form-select"
                    value={contactMode}
                    onChange={(e) => setContactMode(e.target.value as any)}
                  >
                    <option value="high_frequency">「側で支えてほしい」モード（高頻度）</option>
                    <option value="on_alert">「やばかったら声かけて」モード（進捗遅れ時）</option>
                    <option value="low_frequency">「見守って欲しい」モード（ノート提出時のみ）</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "12px", marginTop: "8px", fontSize: "0.9rem" }}
                >
                  🚀 登録してアプリを始める！
                </button>
              </form>
            )}
          </div>
        )}

        {/* コーチログインコンテンツ */}
        {activeRole === "coach" && (
          <div className="flex-column gap-sm">
            <p style={{ fontSize: "0.8rem", color: "#475569", marginBottom: "4px" }}>
              指導者アカウントを選択してログインしてください。生徒カルテのモニタリングおよびノートへのフィードバック送信が可能です。
            </p>

            <div className="flex-column gap-xs">
              {DEMO_COACHES.map((coach) => (
                <button
                  key={coach.id}
                  className="btn"
                  style={{
                    padding: "14px",
                    textAlign: "left",
                    justifyContent: "space-between",
                    background: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                  }}
                  onClick={() => onLoginCoach(coach)}
                >
                  <div>
                    <span style={{ fontWeight: "800", color: "#38bdf8" }}>👨‍🏫 {coach.name}</span>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{coach.sport}</div>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: "700" }}>コーチログイン →</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginModal;
