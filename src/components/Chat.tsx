import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, UserSettings } from "../services/gemini";

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  settings: UserSettings;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  isTyping,
  settings,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // コーチの基本情報を取得
  const getCoachDetails = () => {
    switch (settings.characterType) {
      case "passionate":
        return { name: "熱血監督コーチ", avatar: "🔥" };
      case "gentle":
        return { name: "寄り添いコーチ", avatar: "🧸" };
      case "logical":
        return { name: "分析官コーチ", avatar: "👓" };
      case "friendly":
        return { name: "フレンドリーコーチ", avatar: "✨" };
      default:
        return { name: "AIコーチ", avatar: "🤖" };
    }
  };

  const coach = getCoachDetails();

  // 自動スクロール処理
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText("");
  };

  // 時刻フォーマット (例: 14:32)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // メッセージリストに日付の仕切りを挟むための処理
  const renderMessagesWithDates = () => {
    const rendered: React.ReactNode[] = [];
    let lastDate = "";

    messages.forEach((msg) => {
      let msgDate = "";
      try {
        msgDate = new Date(msg.timestamp).toLocaleDateString([], {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        });
      } catch {
        msgDate = "今日";
      }

      // 日付が変わったら仕切りを追加
      if (msgDate !== lastDate) {
        rendered.push(
          <div key={`date-${msg.id}`} className="chat-date-divider">
            {msgDate}
          </div>
        );
        lastDate = msgDate;
      }

      const isUser = msg.sender === "user";

      rendered.push(
        <div key={msg.id} className={`chat-message ${isUser ? "user" : "ai"}`}>
          {!isUser && (
            <div className="chat-avatar">
              {coach.avatar}
            </div>
          )}
          <div className="chat-message-content">
            <span className="chat-sender-name">
              {isUser ? settings.nickname : coach.name}
            </span>
            <div className="chat-bubble-wrapper">
              <div className={`chat-bubble ${msg.isRisk ? "risk-detected" : ""}`}>
                {msg.text}
              </div>
              <span className="chat-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        </div>
      );
    });

    return rendered;
  };

  return (
    <div className="chat-container">
      
      {/* チャット履歴 */}
      <div className="chat-history">
        {messages.length === 0 ? (
          <div className="text-center" style={{ color: "rgba(255,255,255,0.8)", marginTop: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>{coach.avatar}</div>
            <h3>こんにちは！{settings.nickname}選手！</h3>
            <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
              今日のスポーツノートを提出するか、<br />
              ここからAIコーチに話しかけてみよう！
            </p>
          </div>
        ) : (
          renderMessagesWithDates()
        )}

        {/* AIがタイピング中のアニメーションインジケーター */}
        {isTyping && (
          <div className="chat-message ai">
            <div className="chat-avatar">{coach.avatar}</div>
            <div className="chat-message-content">
              <span className="chat-sender-name">{coach.name}</span>
              <div className="chat-bubble-wrapper">
                <div className="chat-bubble" style={{ padding: "4px 8px" }}>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 送信フォーム */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`${coach.name}にメッセージを送る...`}
          disabled={isTyping}
        />
        <button type="submit" className="chat-send-btn" disabled={isTyping || !inputText.trim()}>
          ✈️
        </button>
      </form>

    </div>
  );
};
export default Chat;
