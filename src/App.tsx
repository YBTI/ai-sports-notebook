import React, { useState, useEffect } from "react";
import Dashboard, { WeeklyGoals, DailyLog } from "./components/Dashboard";
import Chat from "./components/Chat";
import Settings from "./components/Settings";
import AdminDashboard, { checkMessageRisk } from "./components/AdminDashboard";
import Mailbox, { CoachFeedback } from "./components/Mailbox";
import LoginScreen, { UserAccount } from "./components/LoginScreen";
import { UserSettings, ChatMessage, sendMessageToGemini } from "./services/gemini";

const API_BASE = "http://localhost:3001";

// LocalStorage 用のキー名
const LOCAL_STORAGE_KEYS = {
  SETTINGS: "ai_sports_settings_v1",
  GOALS: "ai_sports_goals_v1",
  MESSAGES: "ai_sports_messages_v1",
  FEEDBACKS: "ai_sports_feedbacks_v1",
  AUTH_ACCOUNT: "ai_sports_auth_account_v1",
};

// デフォルト値の定義
const DEFAULT_SETTINGS: UserSettings = {
  nickname: "コウタ",
  grade: "junior_high",
  characterType: "passionate",
  contactMode: "high_frequency",
};

const DEFAULT_GOALS: WeeklyGoals = {
  studyGoal: "数学のワークP10〜P20を終わらせる",
  sportsGoal: "毎日素振り100回、ランニング合計15km",
  studyProgress: 40,
  sportsProgress: 60,
};

const DEFAULT_FEEDBACKS: CoachFeedback[] = [
  {
    id: "fb-welcome-1",
    date: new Date().toLocaleDateString("ja-JP"),
    coachName: "山田ヘッドコーチ",
    coachRole: "部活動・生活指導主任",
    title: "【歓迎】キソレンモバイルへようこそ！",
    content: `コウタ選手！キソレンモバイルへの登録ありがとう！\n\nここでの毎日の「スポーツノート」の提出は、わたくし山田コーチをはじめとするリアルな部活コーチ陣がすべて拝見し、一人ひとりにフィードバックをお届けします。\n\n文武両道は大変ですが、小さな毎日の積み重ねが大きな結果を生みます。目標に向けて一緒に頑張りましょう！`,
    isRead: false,
    isSaved: true,
  },
];

export const App: React.FC = () => {
  // 認証・ロール管理状態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userRole, setUserRole] = useState<"student" | "coach">("student");

  // タブ状態 (生徒: "dashboard" | "chat" | "mailbox" | "settings" / コーチ: "carte" | "reply" | "settings")
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // グローバル状態
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [goals, setGoals] = useState<WeeklyGoals>(DEFAULT_GOALS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<CoachFeedback[]>(DEFAULT_FEEDBACKS);
  const [isTyping, setIsTyping] = useState(false);

  // サーバーから生徒のフィードバックメールを受信して同期
  const syncFeedbacksWithServer = async (studentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/feedbacks/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.feedbacks && data.feedbacks.length > 0) {
          setFeedbacks(data.feedbacks);
          localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACKS, JSON.stringify(data.feedbacks));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch feedbacks from server", e);
    }
  };

  // 起動時に LocalStorage からロード
  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    const savedGoals = localStorage.getItem(LOCAL_STORAGE_KEYS.GOALS);
    const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEYS.MESSAGES);
    const savedFeedbacks = localStorage.getItem(LOCAL_STORAGE_KEYS.FEEDBACKS);
    const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNT);

    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error("Failed to parse settings", e); }
    }
    if (savedGoals) {
      try { setGoals(JSON.parse(savedGoals)); } catch (e) { console.error("Failed to parse goals", e); }
    }
    if (savedFeedbacks) {
      try { setFeedbacks(JSON.parse(savedFeedbacks)); } catch (e) { console.error("Failed to parse feedbacks", e); }
    }
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        setCurrentUser(auth);
        setUserRole(auth.role);
        setIsLoggedIn(true);
        setActiveTab(auth.role === "student" ? "dashboard" : "carte");

        if (auth.role === "student") {
          syncFeedbacksWithServer(auth.id);
        }
      } catch (e) { console.error("Failed to parse auth", e); }
    }
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) { console.error("Failed to parse messages", e); }
    } else {
      const initialMsg: ChatMessage = {
        id: "init-1",
        sender: "ai",
        text: `${DEFAULT_SETTINGS.nickname}選手！今日もお疲れ様！専属AIコーチだ！\n気になることや相談があれば何でも気軽に聞いてくれ！ノートの提出はリアルコーチに送信されるぞ！🔥`,
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMsg]);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify([initialMsg]));
    }
  }, []);

  // 生徒ログイン
  const handleLoginStudent = (account: UserAccount, newSettings?: UserSettings) => {
    setCurrentUser(account);
    setUserRole("student");
    setIsLoggedIn(true);
    setActiveTab("dashboard");
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNT, JSON.stringify(account));

    if (newSettings) {
      setSettings(newSettings);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } else if (account.settings) {
      setSettings(account.settings);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(account.settings));
    }

    syncFeedbacksWithServer(account.id);
  };

  // コーチログイン
  const handleLoginCoach = (account: UserAccount) => {
    setCurrentUser(account);
    setUserRole("coach");
    setIsLoggedIn(true);
    setActiveTab("carte");
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNT, JSON.stringify(account));
  };

  // ログアウト
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNT);
  };

  // 設定保存
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));

    if (currentUser && currentUser.role === "student") {
      const updatedUser = { ...currentUser, name: newSettings.nickname, settings: newSettings };
      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNT, JSON.stringify(updatedUser));
    }

    const coachEmojis = { passionate: "🔥", gentle: "🧸", logical: "👓", friendly: "✨" };
    const emoji = coachEmojis[newSettings.characterType] || "🤖";

    const newWelcome: ChatMessage = {
      id: `welcome-change-${Date.now()}`,
      sender: "ai",
      text: `設定が更新されたぞ！これからはこの私（${emoji}）が、${newSettings.nickname}のコーチを務める！よろしく頼む！`,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newWelcome];
    setMessages(updatedMessages);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
  };

  // 目標更新
  const handleUpdateGoals = (newGoals: WeeklyGoals) => {
    setGoals(newGoals);
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
  };

  // メッセージ送信処理
  const processUserMessage = async (text: string) => {
    const riskCheck = checkMessageRisk(text);

    const newUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toISOString(),
      isRisk: riskCheck.isRisk,
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));

    setIsTyping(true);

    try {
      const aiResponseText = await sendMessageToGemini(updatedMessages, settings);

      const newAiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, newAiMsg];
      setMessages(finalMessages);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(finalMessages));
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ サーバーとの接続中にエラーが発生しました: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(finalMessages));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (text: string) => {
    processUserMessage(text);
  };

  const handleMarkAsRead = async (id: string) => {
    const updated = feedbacks.map((f) => (f.id === id ? { ...f, isRead: true } : f));
    setFeedbacks(updated);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACKS, JSON.stringify(updated));

    try {
      await fetch(`${API_BASE}/api/feedbacks/${id}/read`, { method: "POST" });
    } catch (e) {}
  };

  const handleToggleSave = async (id: string) => {
    const target = feedbacks.find((f) => f.id === id);
    const newSaveState = target ? !target.isSaved : true;

    const updated = feedbacks.map((f) => (f.id === id ? { ...f, isSaved: newSaveState } : f));
    setFeedbacks(updated);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACKS, JSON.stringify(updated));

    try {
      await fetch(`${API_BASE}/api/feedbacks/${id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: newSaveState }),
      });
    } catch (e) {}
  };

  const handleSendFeedbackFromAdmin = async (newFb: {
    studentId: string;
    coachName: string;
    coachRole: string;
    title: string;
    content: string;
    notebookSnapshot?: any;
  }) => {
    const created: CoachFeedback = {
      id: `fb-admin-${Date.now()}`,
      date: new Date().toLocaleDateString("ja-JP"),
      coachName: newFb.coachName,
      coachRole: newFb.coachRole,
      title: newFb.title,
      content: newFb.content,
      notebookSnapshot: newFb.notebookSnapshot,
      isRead: false,
      isSaved: false,
    };

    const updated = [created, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACKS, JSON.stringify(updated));
  };

  // 生徒からリアルコーチへのノート提出
  const handleSubmitNotebook = async (log: DailyLog, textForChat: string) => {
    const studentId = currentUser ? currentUser.id : "std-1";
    const studentName = settings.nickname || (currentUser ? currentUser.name : "生徒");

    // 1. サーバーへ提出API呼出
    try {
      await fetch(`${API_BASE}/api/notebooks/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          notebook: log,
        }),
      });
    } catch (e) {
      console.warn("Failed to post notebook to server", e);
    }

    // 2. 達成度ブースト
    const progressBoost = 10;
    const nextStudyProgress = log.studyActivity ? Math.min(goals.studyProgress + progressBoost, 100) : goals.studyProgress;
    const nextSportsProgress = log.sportsActivity ? Math.min(goals.sportsProgress + progressBoost, 100) : goals.sportsProgress;

    const newGoals = {
      ...goals,
      studyProgress: nextStudyProgress,
      sportsProgress: nextSportsProgress,
    };
    setGoals(newGoals);
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(newGoals));

    alert("📝 今日のスポーツノートをリアルのコーチ（管理者）に提出しました！\nコーチからフィードバックが届くと「メール」に通知されます。");

    // メールタブへ移動
    setActiveTab("mailbox");
  };

  const getCoachAvatar = () => {
    switch (settings.characterType) {
      case "passionate": return "🔥";
      case "gentle": return "🧸";
      case "logical": return "👓";
      case "friendly": return "✨";
      default: return "🤖";
    }
  };

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;

  // 未ログインの場合は全画面ログインコンポーネントを表示
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginStudent={handleLoginStudent}
        onLoginCoach={handleLoginCoach}
      />
    );
  }

  return (
    <div className="app-container">
      
      {/* アプリヘッダー */}
      <header className="app-header">
        <h1 className="app-logo">
          🏆 <span>キソレンモバイル</span>
        </h1>
        
        {userRole === "student" ? (
          <div className="coach-status-header">
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>AI専属</span>
            <div className="coach-avatar-mini">{getCoachAvatar()}</div>
            <span style={{ fontWeight: "700", fontSize: "0.8rem" }}>{settings.nickname}担当</span>
          </div>
        ) : (
          <div className="coach-status-header" style={{ background: "#0f172a", color: "#38bdf8", border: "1px solid #0284c7", padding: "4px 10px", borderRadius: "20px" }}>
            <span style={{ fontSize: "0.75rem" }}>👨‍🏫 コーチ</span>
            <span style={{ fontWeight: "700", fontSize: "0.8rem" }}>{currentUser?.name}</span>
          </div>
        )}
      </header>

      {/* メインコンテンツ表示（ロールで完全分岐） */}
      <main className="app-main">
        
        {/* 生徒用画面ビュー */}
        {userRole === "student" && (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                goals={goals}
                onUpdateGoals={handleUpdateGoals}
                onSubmitNotebook={handleSubmitNotebook}
                nickname={settings.nickname}
              />
            )}

            {activeTab === "chat" && (
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                settings={settings}
              />
            )}

            {activeTab === "mailbox" && (
              <Mailbox
                feedbacks={feedbacks}
                onMarkAsRead={handleMarkAsRead}
                onToggleSave={handleToggleSave}
                nickname={settings.nickname}
              />
            )}

            {activeTab === "settings" && (
              <Settings
                settings={settings}
                onSave={handleSaveSettings}
                currentUser={currentUser || undefined}
                onLogout={handleLogout}
              />
            )}
          </>
        )}

        {/* コーチ（管理者）用画面ビュー */}
        {userRole === "coach" && (
          <>
            {(activeTab === "carte" || activeTab === "reply" || activeTab === "ai_log") && (
              <AdminDashboard
                currentSettings={settings}
                currentMessages={messages}
                currentGoals={goals}
                onSendFeedback={handleSendFeedbackFromAdmin}
                activeTabProp={activeTab as "carte" | "reply" | "ai_log"}
              />
            )}

            {activeTab === "settings" && (
              <Settings
                settings={settings}
                onSave={handleSaveSettings}
                currentUser={currentUser || undefined}
                onLogout={handleLogout}
              />
            )}
          </>
        )}

      </main>

      {/* ボトムナビゲーションバー（ロールで完全分離） */}
      <nav className="app-nav">
        
        {userRole === "student" ? (
          /* 生徒用ボトムナビ: ノート / AIコーチ / メール / 設定 */
          <>
            <button
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span className="nav-icon">🏠</span>
              <span>ノート</span>
            </button>

            <button
              className={`nav-item ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <span className="nav-icon">💬</span>
              <span>AIコーチ</span>
            </button>

            <button
              className={`nav-item ${activeTab === "mailbox" ? "active" : ""}`}
              onClick={() => setActiveTab("mailbox")}
              style={{ position: "relative" }}
            >
              <span className="nav-icon">📬</span>
              <span>メール</span>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "2px",
                  right: "22%",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="nav-icon">⚙️</span>
              <span>設定</span>
            </button>
          </>
        ) : (
          /* コーチ（管理者）用ボトムナビ: 生徒カルテ / メール返信 / AIログ / 設定 */
          <>
            <button
              className={`nav-item ${activeTab === "carte" ? "active" : ""}`}
              onClick={() => setActiveTab("carte")}
            >
              <span className="nav-icon">📋</span>
              <span>生徒カルテ</span>
            </button>

            <button
              className={`nav-item ${activeTab === "reply" ? "active" : ""}`}
              onClick={() => setActiveTab("reply")}
            >
              <span className="nav-icon">✉️</span>
              <span>メール返信</span>
            </button>

            <button
              className={`nav-item ${activeTab === "ai_log" ? "active" : ""}`}
              onClick={() => setActiveTab("ai_log")}
            >
              <span className="nav-icon">💬</span>
              <span>AIログ</span>
            </button>

            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="nav-icon">⚙️</span>
              <span>設定</span>
            </button>
          </>
        )}

      </nav>

    </div>
  );
};
export default App;
