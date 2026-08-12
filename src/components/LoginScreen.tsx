import React, { useState } from "react";
import { UserSettings } from "../services/gemini";

export interface UserAccount {
  id: string;
  loginId?: string;
  name: string;
  role: "student" | "coach";
  grade?: string;
  sport?: string;
  settings?: UserSettings;
}

interface LoginScreenProps {
  onLoginStudent: (account: UserAccount, newSettings?: UserSettings) => void;
  onLoginCoach: (account: UserAccount) => void;
}

const API_BASE = "";

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginStudent,
  onLoginCoach,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 新規登録用
  const [regLoginId, setRegLoginId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState<"elementary" | "junior_high" | "high">("junior_high");
  const [characterType, setCharacterType] = useState<"passionate" | "gentle" | "logical" | "friendly">("passionate");
  const [contactMode, setContactMode] = useState<"high_frequency" | "on_alert" | "low_frequency">("high_frequency");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginId.trim() || !password.trim()) {
      setErrorMsg("ログインIDとパスワードを入力してください。");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: loginId.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "ログインに失敗しました。");
        return;
      }

      const account: UserAccount = data.account;

      if (account.role === "coach") {
        onLoginCoach(account);
      } else {
        onLoginStudent(account, account.settings);
      }
    } catch (err) {
      setErrorMsg("サーバーに接続できませんでした。バックエンドが起動しているか確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!regLoginId.trim() || !regPassword.trim() || !nickname.trim()) {
      setErrorMsg("すべての必須項目を入力してください。");
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setErrorMsg("パスワードが一致しません。");
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg("パスワードは4文字以上で設定してください。");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: regLoginId.trim(),
          password: regPassword.trim(),
          name: nickname.trim(),
          grade,
          characterType,
          contactMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "登録に失敗しました。");
        return;
      }

      const account: UserAccount = data.account;
      onLoginStudent(account, account.settings);
    } catch (err) {
      setErrorMsg("サーバーに接続できませんでした。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* 背景装飾 */}
      <div className="login-bg-decor">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
      </div>

      <div className="login-container">
        {/* ロゴ */}
        <div className="login-logo-section">
          <span className="login-logo-emoji">🏆</span>
          <h1 className="login-title">キソレンモバイル</h1>
          <p className="login-subtitle">スポーツと勉強の目標達成＆指導者伴走アプリ</p>
        </div>

        {/* エラーメッセージ */}
        {errorMsg && (
          <div className="login-error">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {mode === "login" ? (
          /* ====== ログインフォーム ====== */
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-form-group">
              <label className="login-label">ログインID</label>
              <input
                type="text"
                className="login-input"
                placeholder="例: kouta, yamada"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">パスワード</label>
              <input
                type="password"
                className="login-input"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-btn login-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner">⏳</span>
              ) : (
                <>🔐 ログイン</>
              )}
            </button>

            <div className="login-divider">
              <span>はじめてのご利用ですか？</span>
            </div>

            <button
              type="button"
              className="login-btn login-btn-secondary"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
              }}
            >
              ✨ 新規アカウント登録（生徒用）
            </button>

            {/* デモ用アカウント情報 */}
            <div className="login-demo-info">
              <p className="login-demo-title">📋 デモ用アカウント</p>
              <div className="login-demo-grid">
                <div className="login-demo-card">
                  <span className="login-demo-badge student">生徒</span>
                  <div><strong>kouta</strong> / 1234</div>
                </div>
                <div className="login-demo-card">
                  <span className="login-demo-badge student">生徒</span>
                  <div><strong>kenta</strong> / 1234</div>
                </div>
                <div className="login-demo-card">
                  <span className="login-demo-badge student">生徒</span>
                  <div><strong>haruka</strong> / 1234</div>
                </div>
                <div className="login-demo-card">
                  <span className="login-demo-badge coach">コーチ</span>
                  <div><strong>yamada</strong> / coach1234</div>
                </div>
                <div className="login-demo-card">
                  <span className="login-demo-badge coach">コーチ</span>
                  <div><strong>sato</strong> / coach1234</div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* ====== 新規登録フォーム ====== */
          <form onSubmit={handleRegister} className="login-form">
            <div className="login-register-header">
              <button
                type="button"
                className="login-back-btn"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
              >
                ← ログイン画面に戻る
              </button>
              <h2 className="login-register-title">📝 新規プロフィール登録</h2>
            </div>

            <div className="login-form-group">
              <label className="login-label">ログインID <span className="login-required">*必須</span></label>
              <input
                type="text"
                className="login-input"
                placeholder="半角英数字（例: taro123）"
                value={regLoginId}
                onChange={(e) => setRegLoginId(e.target.value)}
                autoFocus
              />
            </div>

            <div className="login-form-row">
              <div className="login-form-group">
                <label className="login-label">パスワード <span className="login-required">*必須</span></label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="4文字以上"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">パスワード確認</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="もう一度入力"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">ニックネーム（呼び名） <span className="login-required">*必須</span></label>
              <input
                type="text"
                className="login-input"
                placeholder="例: たろう、ハナ"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">学年</label>
              <select
                className="login-select"
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
              >
                <option value="elementary">小学生</option>
                <option value="junior_high">中学生</option>
                <option value="high">高校生</option>
              </select>
            </div>

            <div className="login-form-group">
              <label className="login-label">専属AIコーチの性格タイプ</label>
              <select
                className="login-select"
                value={characterType}
                onChange={(e) => setCharacterType(e.target.value as any)}
              >
                <option value="passionate">🔥 熱血監督タイプ（熱く力強い言葉）</option>
                <option value="gentle">🧸 優しく寄り添う兄・姉タイプ（共感・丁寧）</option>
                <option value="logical">👓 冷静な分析官タイプ（データ・論理的）</option>
                <option value="friendly">✨ フレンドリーマネージャータイプ（タメ口応援）</option>
              </select>
            </div>

            <div className="login-form-group">
              <label className="login-label">声かけモード</label>
              <select
                className="login-select"
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
              className="login-btn login-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner">⏳</span>
              ) : (
                <>🚀 登録してアプリを始める！</>
              )}
            </button>
          </form>
        )}

        <p className="login-footer">© 2026 キソレンモバイル</p>
      </div>
    </div>
  );
};

export default LoginScreen;
