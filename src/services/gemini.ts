export interface UserSettings {
  nickname: string;
  grade: "elementary" | "junior_high" | "high";
  characterType: "passionate" | "gentle" | "logical" | "friendly";
  contactMode: "high_frequency" | "on_alert" | "low_frequency";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isRisk?: boolean; // SOS・個人情報検知フラグ
}

// バックエンド経由でGemini APIを呼び出す
export async function sendMessageToGemini(
  chatHistory: ChatMessage[],
  settings: UserSettings
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
        settings: settings,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.warn("Backend API call failed. Falling back to local mock response. Error details:", error);
    
    // バックエンドエラーまたはAPIキー未設定のとき、モック応答へスムーズにフォールバック
    const lastUserMsgObj = chatHistory[chatHistory.length - 1];
    const lastUserMsg = lastUserMsgObj ? lastUserMsgObj.text : "";
    const isNotebook = lastUserMsg.includes("今日のスポーツノート");
    
    return await getMockAIResponse(lastUserMsg, settings, isNotebook);
  }
}

// --- ローカルモックAI応答（フォールバック用） ---
export async function getMockAIResponse(
  userMessage: string,
  settings: UserSettings,
  isNotebookSubmission: boolean = false
): Promise<string> {
  // タイピング中アニメーションを体験してもらうために、1.5秒程度のディレイをかける
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { nickname, characterType } = settings;
  const isElementary = settings.grade === "elementary";

  if (isNotebookSubmission) {
    // スポーツノートが提出されたときの応答
    switch (characterType) {
      case "passionate":
        if (isElementary) {
          return `（サーバー接続エラーのため、モックが動いています）\nおおっ！きょうのスポーツとべんきょうのノート、たしかにうけとったぞ！\n${nickname}！きょうもさいごまでよく走りぬいたな！すばらしいド根性だ！🔥`;
        }
        return `（サーバー接続エラーのため、モックが動いています）\nおおっ！今日のトレーニングと勉強の進捗ログ、しかと確認したぞ！\n${nickname}！今日の頑張りは本物だ！明日も自分自身の限界を超えていくぞ！💪🔥`;

      case "gentle":
        if (isElementary) {
          return `（サーバー接続エラーのため、モックが動いています）\nノートをおくってくれてありがとう、${nickname}ちゃん。\nきょうもべんきょうとスポーツ、両方がんばって本当にえらいね。ゆっくりやすんでね。`;
        }
        return `（サーバー接続エラーのため、モックが動いています）\nノートの提出ありがとうございます、${nickname}さん。\n今日もお勉強とスポーツ練習、お疲れ様でした。無理だけはしないで、今夜はしっかりストレッチをして身体を休めてくださいね。`;

      case "logical":
        if (isElementary) {
          return `（サーバー接続エラーのため、モックが動いています）\nノートのていしつをかくにんしました。\nきょうのしんちょくはよていどおりです。あしたも、すこしずつすすめていきましょう。`;
        }
        return `（サーバー接続エラーのため、モックが動いています）\nスポーツノートの提出を確認しました、${nickname}さん。\n本日の進捗状況を分析したところ、計画通り推移しています。明日もこのペースを維持していきましょう。`;

      case "friendly":
        if (isElementary) {
          return `（サーバー接続エラーのため、モックが動いています）\nヤッホー！きょうのノートみたよ！✨\n${nickname}ちゃん、べんきょうもスポーツもめっちゃがんばっててすごすぎる！😆あしたもたのしくいこー！`;
        }
        return `（サーバー接続エラーのため、モックが動いています）\nおつかれさま〜！今日のノート届いたよ！✨\n${nickname}、今日のメニューめっちゃ濃いのにしっかりやりきってて天才じゃん！😆明日もこの調子で楽しんでいこー！📣`;
    }
  } else {
    // 通常のチャットでの会話応答
    const text = userMessage.toLowerCase();
    
    // SOS / リスク検知ワード（モック側でも対応）
    if (text.includes("死") || text.includes("たすけて") || text.includes("助けて") || text.includes("いじめ")) {
      return `大丈夫ですか？つらい気持ちを話してくれてありがとうございます。一人で抱え込まずに、身近な大人や先生、家族にも相談してみてくださいね。私たちはいつでもあなたの味方です。`;
    }

    if (text.includes("疲") || text.includes("つかれた") || text.includes("しんどい")) {
      switch (characterType) {
        case "passionate":
          return `疲れたか！それは全力で戦った証拠だ！素晴らしい！\nだが${nickname}、休むことも超一流のアスリートの仕事だぞ！しっかり肉を食って、ぐっすり眠れ！`;
        case "gentle":
          return `今日はいっぱい頑張ったんだね。お疲れ様、${nickname}ちゃん。\nココアでも飲んで、身体を温めてね。無理に動こうとしなくて大丈夫だよ。`;
        case "logical":
          return `疲労が蓄積しているようですね。オーバートレーニングを防ぐためにも、本日は早めに休息を取り、リカバリーに専念することを推奨します。`;
        case "friendly":
          return `うわぁ〜、がんばりすぎだよー！大丈夫？🥺\n今日はもう勉強も部活のことも忘れて、好きなもの食べてゴロゴロしちゃお！`;
      }
    }

    if (text.includes("勉強") || text.includes("べんきょう") || text.includes("宿題") || text.includes("テスト")) {
      switch (characterType) {
        case "passionate":
          return `勉強だな！よし、スポーツと同じだ！「反復練習」あるのみ！\nやればやるほど脳の筋肉が鍛えられるぞ！負けるな、${nickname}！`;
        case "gentle":
          return `勉強のことで悩んでいるのかな？\n一気にやろうとすると大変だから、まずは机に向かって教科書を開くことから始めよう。`;
        case "logical":
          return `学習計画ですね。まずは目標を細分化し、15分単位のタイムボックスで集中して取り組む「ポモドーロ・テクニック」の導入を検討してみてください。`;
        case "friendly":
          return `勉強か〜！えらいっ！✨\nとりあえず、お気に入りの音楽かけて5分だけやってみるのはどう？やり始めると意外と集中できちゃったりするよ！`;
      }
    }

    // デフォルト応答
    switch (characterType) {
      case "passionate":
        return `${nickname}！素晴らしいメッセージをありがとう！\n何があっても俺は応援している！さあ、今日も全力で突き進むぞ！オーッ！`;
      case "gentle":
        return `お返事ありがとうございます、${nickname}さん。\nお話ができて嬉しいです。いつでもあなたの悩みや嬉しい報告を聴かせてくださいね。`;
      case "logical":
        return `メッセージを確認しました。${nickname}さんの日々の目標達成に向けて、今後もデータと対話の両面からサポートさせていただきます。`;
      case "friendly":
        return `返信ありがとう〜！😆✨\n${nickname}と話してるとめっちゃ元気もらえるわ！これからも一緒に楽しく突っ走ろ〜！`;
    }
  }
}
