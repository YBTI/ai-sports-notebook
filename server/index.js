import { fileURLToPath } from 'url';
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const uploadDir = path.join(__dirname, '../public/uploads');

// Initialize Supabase client only if both URL and KEY are set
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const app = express();
const PORT = process.env.PORT || process.env.VITE_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Local data persistence via JSON file
const dataFilePath = path.join(__dirname, '../data.json');

function loadData() {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    // If file does not exist, initialize with empty arrays including accounts
    const init = { accounts: [], goals: [], milestones: [], feedbacks: [], submittedNotebooks: [] };
    fs.writeFileSync(dataFilePath, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Load data at start
let { accounts, goals, milestones, feedbacks, submittedNotebooks } = loadData();

// Helper to persist after modifications
function persist() {
  saveData({ accounts, goals, milestones, feedbacks, submittedNotebooks });
}

app.use('/uploads', express.static(uploadDir));
const upload = multer({ dest: uploadDir });

// Simple in‑memory message store for coach comments
let messages = [];
// Helper to generate milestones via Gemini
async function generateMilestones(finalGoal, nearGoal, grade) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return [];
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `ユーザーの学年:${grade}、最終目標:${finalGoal}、直近目標:${nearGoal}です。4〜6段階のマイルストーンに分解し、各ステップに step_number, title, description, advice を含む JSON 配列で返してください。`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response?.text() ?? "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Gemini milestone generation error", e);
    return [];
  }
}


// ==============================
// ユーザーアカウント管理（デモ用インメモリストア）
// ==============================
// Load persisted data arrays (goals, milestones, feedbacks, submittedNotebooks, accounts) are already defined above via loadData().
// No need to redeclare them here if already present in data.json.
// However, if empty, we might seed default accounts:

if (accounts.length === 0) {
  accounts = [
    {
      id: "std-1",
      loginId: "kouta",
      password: "1234",
      role: "student",
      name: "コウタ",
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
      loginId: "kenta",
      password: "1234",
      role: "student",
      name: "けんた",
      grade: "junior_high",
      sport: "野球部",
      settings: {
        nickname: "けんた",
        grade: "junior_low",
        characterType: "friendly",
        contactMode: "high_frequency",
      },
    },
    {
      id: "std-3",
      loginId: "haruka",
      password: "1234",
      role: "student",
      name: "はるか",
      grade: "elementary",
      sport: "陸上部",
      settings: {
        nickname: "はるか",
        grade: "elementary",
        characterType: "gentle",
        contactMode: "on_alert",
      },
    },
    {
      id: "coach-1",
      loginId: "yamada",
      password: "coach1234",
      role: "coach",
      name: "山田ヘッドコーチ",
      sport: "部活動・生活指導主任",
    },
    {
      id: "coach-2",
      loginId: "sato",
      password: "coach1234",
      role: "coach",
      name: "佐藤学習アドバイザー",
      sport: "学習・進路チーフアドバイザー",
    },
  ];
  persist();
}

// ==============================
// ログインAPI
// ==============================
app.post("/api/login", (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ error: "ログインIDとパスワードを入力してください。" });
  }

  const account = accounts.find(
    (a) => a.loginId === loginId && a.password === password
  );

  if (!account) {
    return res.status(401).json({ error: "ログインIDまたはパスワードが正しくありません。" });
  }

  const { password: _, ...safeAccount } = account;
  return res.json({ account: safeAccount });
});

// ==============================
// 新規生徒登録API
// ==============================
app.post("/api/register", (req, res) => {
  const { loginId, password, name, grade, characterType, contactMode } = req.body;

  if (!loginId || !password || !name) {
    return res.status(400).json({ error: "必須項目を入力してください。" });
  }

  const existing = accounts.find((a) => a.loginId === loginId);
  if (existing) {
    return res.status(409).json({ error: "そのログインIDは既に使用されています。" });
  }

  const newAccount = {
    id: `std-${Date.now()}`,
    loginId,
    password,
    role: "student",
    name,
    grade: grade || "junior_high",
    sport: "スポーツ＆勉学",
    settings: {
      nickname: name,
      grade: grade || "junior_high",
      characterType: characterType || "passionate",
      contactMode: contactMode || "high_frequency",
    },
  };

  accounts.push(newAccount);
  persist();

  const { password: _, ...safeAccount } = newAccount;
  return res.json({ account: safeAccount });
});

// ------------------------------
// Goal & Milestone APIs
// ------------------------------

// Create a new goal and generate milestones
app.post("/api/goals", async (req, res) => {
  const { userId, final_goal, near_goal, grade } = req.body;
  if (!userId || !final_goal || !near_goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const goalId = `goal-${Date.now()}`;
  const newGoal = { id: goalId, user_id: userId, final_goal, near_goal, created_at: new Date().toISOString() };
  goals.unshift(newGoal);
persist();
  const genMilestones = await generateMilestones(final_goal, near_goal, grade || "junior_high");
  const createdMilestones = genMilestones.map((m, idx) => ({
    id: `ms-${Date.now()}-${idx}`,
    goal_id: goalId,
    step_number: m.step_number ?? idx + 1,
    title: m.title ?? `Step ${idx + 1}`,
    description: m.description ?? "",
    advice: m.advice ?? "",
    is_completed: false,
    completed_at: null,
  }));
  milestones.unshift(...createdMilestones);
persist();
});

// Get goal + its milestones for a user
app.get("/api/goals/:userId", (req, res) => {
  const { userId } = req.params;
  const userGoal = goals.find((g) => g.user_id === userId);
  if (!userGoal) return res.status(404).json({ error: "Goal not found" });
  const related = milestones.filter((m) => m.goal_id === userGoal.id);
  return res.json({ goal: userGoal, milestones: related });
});

// Mark milestone as completed
app.patch("/api/milestones/:id/complete", (req, res) => {
  const { id } = req.params;
  const ms = milestones.find((m) => m.id === id);
  if (!ms) return res.status(404).json({ error: "Milestone not found" });
  ms.is_completed = true;
  ms.completed_at = new Date().toISOString();
  return res.json({ success: true, milestone: ms });
});

// Add comment (coach feedback) to milestone
app.post("/api/milestones/:id/comment", (req, res) => {
  const { id } = req.params;
  const { coachName, coachRole, title, content, studentId } = req.body;
  if (!coachName || !content) return res.status(400).json({ error: "Missing comment fields" });
  const ms = milestones.find((m) => m.id === id);
  if (!ms) return res.status(404).json({ error: "Milestone not found" });
  const feedback = {
    id: `fb-${Date.now()}`,
    studentId: studentId || "unknown",
    milestoneId: id,
    date: new Date().toLocaleDateString("ja-JP"),
    coachName,
    coachRole,
    title: title || "Coach Comment",
    content,
    isRead: false,
    isSaved: false,
  };
  feedbacks.unshift(feedback);
persist();
  const msg = { sender: "coach", text: `${title ? title + "\n" : ""}${content}`, timestamp: new Date().toISOString() };
  messages.push(msg);
  return res.json({ success: true, feedback });
});

// ==============================
// ノート提出API（生徒 → コーチ）
// ==============================
app.post("/api/notebooks/submit", upload.single('image'), async (req, res) => {
  const { studentId, studentName, note } = req.body;

  // Validate file presence
  if (!req.file) {
    return res.status(400).json({ error: "画像ファイルが必要です。" });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: "画像サイズが5MBを超えています。" });
  }

  // Validate mime type (jpeg or png)
  const allowedMime = ["image/jpeg", "image/png"];
  if (!allowedMime.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "対応フォーマットは JPEG または PNG のみです。" });
  }

  // Read file buffer
  const fileBuffer = fs.readFileSync(req.file.path);
  const fileName = `${Date.now()}_${req.file.originalname}`;

  // Upload to Supabase Storage
  // Check if Supabase credentials are set
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  let imageUrl = "";

  if (supabaseUrl && supabaseKey) {
    const { data, error } = await supabase.storage.from("notebook-images").upload(fileName, fileBuffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (error) {
      console.error("Supabase upload error:", error);
      // fallback to local storage
    } else {
      imageUrl = supabase.storage.from("notebook-images").getPublicUrl(fileName).data.publicUrl;
    }
  }

  // If no imageUrl from Supabase, store locally in uploads folder
  if (!imageUrl) {
    const localPath = path.join(uploadDir, fileName);
    fs.renameSync(req.file.path, localPath);
    imageUrl = `/uploads/${fileName}`; // served statically
  } else {
    // Cleanup temp file used for Supabase upload
    fs.unlinkSync(req.file.path);
  }


  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const entry = {
    id: `nb-${Date.now()}`,
    studentId,
    studentName: studentName || "不明",
    submittedAt: new Date().toISOString(),
    notebook: {
      image_url: imageUrl,
      note: note || "",
    },
    feedback: null,
  };

  submittedNotebooks.unshift(entry);
persist();
});

// ==============================
// 提出ノート一覧取得API（コーチ用）
// ==============================
app.get("/api/notebooks", (req, res) => {
  return res.json({ notebooks: submittedNotebooks });
});

// ==============================
// フィードバック送信API（コーチ → 生徒）
// ==============================
app.post("/api/feedbacks", (req, res) => {
  const { studentId, coachName, coachRole, title, content, notebookId, notebookSnapshot } = req.body;

  if (!studentId || !content) {
    return res.status(400).json({ error: "必須パラメータが不足しています。" });
  }

  const created = {
    id: `fb-${Date.now()}`,
    studentId,
    date: new Date().toLocaleDateString("ja-JP"),
    coachName: coachName || "山田ヘッドコーチ",
    coachRole: coachRole || "総合指導責任者",
    title: title || "【コーチ指導】ノートへのアドバイス",
    content,
    notebookSnapshot,
    isRead: false,
    isSaved: false,
  };

  feedbacks.unshift(created);

  // もし特定のノートIDが指定されていれば、そのノートのfeedbackプロパティを更新
  if (notebookId) {
    const nb = submittedNotebooks.find((n) => n.id === notebookId);
    if (nb) {
      nb.feedback = created;
    }
  }

  return res.json({ success: true, feedback: created });
});

// ==============================
// 生徒のフィードバック受信メール一覧取得API
// ==============================
app.get("/api/feedbacks/:studentId", (req, res) => {
  const { studentId } = req.params;
  const list = feedbacks.filter((f) => f.studentId === studentId || f.studentId === "all");
  return res.json({ feedbacks: list });
});

// ==============================
// フィードバックの既読・保存更新API
// ==============================
app.post("/api/feedbacks/:id/read", (req, res) => {
  const { id } = req.params;
  const fb = feedbacks.find((f) => f.id === id);
  if (fb) {
    fb.isRead = true;
  }
  return res.json({ success: true });
});

app.post("/api/feedbacks/:id/save", (req, res) => {
  const { id } = req.params;
  const { isSaved } = req.body;
  const fb = feedbacks.find((f) => f.id === id);
  if (fb) {
    fb.isSaved = isSaved;
  }
  return res.json({ success: true });
});

// ==============================
// 全生徒一覧取得API（コーチ用カルテ）
// ==============================
app.get("/api/students", (req, res) => {
  const students = accounts
    .filter((a) => a.role === "student")
    .map(({ password, ...rest }) => rest);
  return res.json({ students });
});

// 学年とキャラクターの日本語変換用マッピング
const gradeMapping = {
  elementary: "小学生",
  junior_high: "中学生",
  high: "高校生",
};

const characterMapping = {
  passionate: "熱血監督タイプ（力強い言葉遣い、情熱的）",
  gentle: "優しく寄り添う兄・姉タイプ（共感重視、丁寧）",
  logical: "冷静な分析官タイプ（データ・事実重視、論理的）",
  friendly: "フレンドリーマネージャータイプ（タメ口、応援メイン）",
};

const modeMapping = {
  high_frequency: "「側で支えてほしい」モード（高頻度で中間チェック・声かけ）",
  on_alert: "「やばかったら声かけて」モード（進捗遅れ時のみ注意・励まし）",
  low_frequency: "「見守って欲しい」モード（ノート提出時・週末振り返り時のみ）",
};

// システムプロンプト動的組み立てロジック（サーバー側で隠蔽して安全に実行）
function buildSystemInstruction(settings) {
  const gradeLabel = gradeMapping[settings.grade] || "中学生";
  const charLabel = characterMapping[settings.characterType] || "熱血監督タイプ";
  const modeLabel = modeMapping[settings.contactMode] || "見守って欲しいモード";

  return `
[基本システム指示]
あなたは小中高生を支える信頼できるAIコーチです。

[★絶対ルール：回答の文字数・長さ★]
1. 基本応答は【超短文】（絶対ルール: 全体で2〜3文、合計150文字以内）:
   小中高生がサクッと一瞬で読めるように、長文・長々とした前置き・解説は【厳禁】です。短く要点と励ましだけを伝えてください。
2. 例外（詳細モード）:
   ユーザーが「詳しく教えて」「具体的なコツは？」「なぜ？」など詳細な解説を明示的に要求した時のみ、長文で丁寧に解説してください。それ以外は常に2〜3文の短文を守ってください。

[動的パラメータ（ユーザー設定）]
- ユーザーの学年: ${gradeLabel}
- ユーザーの呼び名: ${settings.nickname}
- コーチの性格/トーン: ${charLabel}
- 現在選択されている声かけモード: ${modeLabel}

[キャラクター設定ごとの具体的なトーンルール]
1. 熱血監督タイプ:
   - 力強い言葉遣い、熱量高め、！マークや「だ！」「ぞ！」を多用する。
   - 例:「${settings.nickname}！その意気だぞ！今日の一歩が未来の勝利に繋がる！」（2文で簡潔に）
2. 優しく寄り添う兄・姉タイプ:
   - 共感重視、丁寧で優しい敬語。
   - 例:「${settings.nickname}さん、今日もお疲れ様。よく頑張ったね、偉いよ！」（2文で簡潔に）
3. 冷静な分析官タイプ:
   - データ・客観的事実重視、論理的で知的な敬語。
   - 例:「${settings.nickname}さん、素晴らしい達成率です。この調子で継続しましょう。」（2文で簡潔に）
4. フレンドリーマネージャータイプ:
   - タメ口、親しみやすい、絵文字多め、明るく応援。
   - 例:「${settings.nickname}、おつかれ〜！✨今日の頑張り最高だね！明日もファイティン！😆」（2文で簡潔に）

[対象学に応じた漢字・表現の配慮]
- 小学生: 難しい漢字は使わず、ひらがなを多めにする。
- 中学生: 思春期の悩みにも配慮した表現にする。
- 高校生: 対等なパートナーとして対話する。

上記ルール（特に基本は2〜3文で簡潔に返答すること）を厳守してください。
  `;
}

// ヘルスチェックエンドポイント
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mode: process.env.GEMINI_API_KEY ? "production" : "mock-fallback",
  });
});

// チャットAPIエンドポイント
app.post("/api/chat", async (req, res) => {
  const { messages, settings } = req.body;

  if (!messages || !settings) {
    return res.status(400).json({ error: "Missing messages or settings parameters." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
    return res.status(401).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = buildSystemInstruction(settings);

    const recentMessages = messages.slice(-10);
    const history = recentMessages.slice(0, -1).map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const latestMessage = recentMessages[recentMessages.length - 1];

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction: systemInstruction,
      },
      history: history,
    });

    const response = await chat.sendMessage({
      message: latestMessage.text,
    });

    const replyText = response.text.trim();
    return res.json({ text: replyText });
  } catch (error) {
    console.error("Gemini API server-side execution error:", error);
    return res.status(500).json({ error: error.message || "Failed to contact Gemini API." });
  }
});

// サーバー起動 (ローカル開発用)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

export default app;

