import { z } from 'zod';
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// DeepSeek API Integration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

interface SentenceResult {
  success: boolean;
  word: string;
  sentence: string;
  difficulty: string;
  fallback: boolean;
  error?: string;
}

async function generateSentenceForWord(
  word: string,
  difficulty: string = 'medium'
): Promise<SentenceResult> {
  if (!word || word.length < 1) {
    return {
      success: false,
      error: '單字長度不能少於 1 個字符',
      word,
      difficulty,
      fallback: true,
      sentence: generateFallbackSentence(word),
    };
  }

  try {
    const prompt = createPrompt(word, difficulty);
    const response = await callDeepSeekAPI(prompt);
    const sentence = extractSentence(response, word);

    return {
      success: true,
      word,
      sentence,
      difficulty,
      fallback: false,
    };
  } catch (error) {
    const fallbackSentence = generateFallbackSentence(word);
    console.error(`Error generating sentence for word [${word}]:`, error);
    return {
      success: false,
      word,
      sentence: fallbackSentence,
      difficulty,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function createPrompt(word: string, difficulty: string): string {
  const styles = [
    '日常對話風格',
    '商務場景風格',
    '學術描述風格',
    '生活故事風格',
    '新聞報道風格',
    '科普說明風格',
    '廣告宣傳風格',
  ];

  const contexts = [
    '在購物場景中',
    '在辦公室環境中',
    '在學校場景裡',
    '在家庭環境中',
    '在社交聚會中',
    '在旅行過程中',
    '在運動場景中',
    '在用餐時間',
  ];

  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
  const selectedContext = contexts[Math.floor(Math.random() * contexts.length)];

  const difficultyInstructions: Record<string, string> = {
    easy: '使用簡單的日常詞彙和基礎句型，句子結構簡單明了',
    medium: '使用中等難度的詞彙和常見句型，句子邏輯清晰',
    hard: '使用較複雜的詞彙和多樣句型（如從句、倒裝等），語境豐富',
  };

  const instruction = difficultyInstructions[difficulty] || difficultyInstructions.medium;

  const variations = [
    `使用${selectedStyle}，${selectedContext}`,
    '避免使用常見的句子結構，要有創意',
    '使用不同的語法結構，如被動語態或條件句',
    '包含時間、地點或人物元素，讓句子更生動',
    '體現單字在不同語境下的核心用法',
  ];

  const extraInstruction = variations[Math.floor(Math.random() * variations.length)];

  return `
請為英語單詞 "${word}" 生成一個獨特的填空練習句子。

核心要求：
1. 句子自然流暢，符合英語語法和表達習慣
2. 準確體現單詞的核心含義和常用用法
3. ${instruction}
4. 句子長度控制在 15-25 詞之間
5. 必須用 "___" 作為填空位置（僅一處填空），且填空處只能填入目標單詞
6. 避免使用過於生僻的詞彙，確保練習實用性

創意要求：
7. ${extraInstruction}

重要：請發揮創造力，生成與常見模板不同的獨特句子，避免重複相似句式。
無需額外解釋，僅返回句子本身。

單詞: ${word}
句子:`;
}

async function callDeepSeekAPI(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const headers = {
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const randomTemp = Math.round((Math.random() * 0.4 + 0.5) * 100) / 100;

  const data = {
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates English fill-in-the-blank sentences.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 150,
    temperature: randomTemp,
    stream: false,
  };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('API Key 無效/過期');
      } else if (response.status === 403) {
        throw new Error('API 權限不足');
      } else if (response.status === 429) {
        throw new Error('API 調用頻率超限');
      } else if (response.status === 500) {
        throw new Error('DeepSeek API 服務器內部錯誤');
      }
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    if (!result.choices || result.choices.length === 0) {
      throw new Error('API 響應無有效內容');
    }

    return result.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('API 調用異常');
  }
}

function extractSentence(response: string, word: string): string {
  let sentence = response.trim();

  // Remove quotes if present
  if ((sentence.startsWith('"') && sentence.endsWith('"')) ||
      (sentence.startsWith("'") && sentence.endsWith("'"))) {
    sentence = sentence.slice(1, -1);
  }

  // Check if sentence contains the blank placeholder
  if (!sentence.includes('___')) {
    const wordLower = word.toLowerCase();
    const sentenceLower = sentence.toLowerCase();
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');

    if (pattern.test(sentenceLower)) {
      sentence = sentence.replace(pattern, '___');
    } else {
      const words = sentence.split(' ');
      if (words.length > 3) {
        const insertPos = Math.floor(words.length / 2);
        words.splice(insertPos, 0, '___');
        sentence = words.join(' ');
      } else {
        sentence = `${sentence.slice(0, -1)} ___.`;
      }
    }
  }

  // Ensure sentence ends with punctuation
  if (!/[.!?]$/.test(sentence)) {
    sentence += '.';
  }

  // Normalize whitespace
  sentence = sentence.replace(/\s+/g, ' ').trim();

  return sentence;
}

function generateFallbackSentence(word: string): string {
  const templates = [
    'We need to ___ carefully before making a decision.',
    'She said that ___ is essential for personal growth.',
    'In daily life, people often ___ to express their feelings.',
    'The teacher told us that ___ can help improve our skills.',
    'When facing challenges, we should ___ with courage.',
    'He spent a lot of time learning how to ___ properly.',
    'This experience taught me the importance of ___.',
    'Many people believe that ___ brings happiness and success.',
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Word Fill Practice routers
  wordFill: router({
    generateSentence: publicProcedure
      .input(z.object({
        word: z.string().min(1),
        difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
      }))
      .mutation(async ({ input }) => {
        return generateSentenceForWord(input.word, input.difficulty);
      }),
    
    generateBatch: publicProcedure
      .input(z.object({
        words: z.array(z.string().min(1)),
        difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
      }))
      .mutation(async ({ input }) => {
        const results = await Promise.all(
          input.words.map(word => generateSentenceForWord(word, input.difficulty))
        );
        return { success: true, results };
      }),
    
    health: publicProcedure.query(() => ({
      status: 'ok',
      timestamp: new Date(),
    })),
  }),
});

export type AppRouter = typeof appRouter;
