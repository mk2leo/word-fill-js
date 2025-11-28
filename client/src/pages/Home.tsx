import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Download, Upload, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Sentence {
  id: number;
  word: string;
  sentence: string;
  answered: boolean;
  aiGenerated: boolean;
  fallback: boolean;
}

interface CheckResult {
  word: string;
  correct: boolean;
  userAnswer: string;
}

export default function Home() {
  const [words, setWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState('');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  const generateBatchMutation = trpc.wordFill.generateBatch.useMutation();

  const addWord = () => {
    const word = wordInput.trim().toLowerCase();
    if (!word) {
      toast.error('請輸入有效的單字');
      return;
    }
    if (words.includes(word)) {
      toast.warning('單字已存在');
      return;
    }
    setWords([...words, word]);
    setWordInput('');
  };

  const removeWord = (index: number) => {
    const removed = words[index];
    setWords(words.filter((_, i) => i !== index));
    toast.success(`已移除: ${removed}`);
  };

  const clearWords = () => {
    setWords([]);
    setSentences([]);
    setUserAnswers({});
    setCheckResults([]);
    setShowResults(false);
    toast.success('已清空');
  };

  const generateSentences = async () => {
    if (words.length === 0) {
      toast.error('請先添加單字');
      return;
    }

    setIsGenerating(true);
    setShowResults(false);
    try {
      const result = await generateBatchMutation.mutateAsync({
        words,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
      });

      const newSentences = result.results.map((item, index) => ({
        id: index + 1,
        word: item.word,
        sentence: item.sentence,
        answered: false,
        aiGenerated: !item.fallback,
        fallback: item.fallback || false,
      }));

      // 隨機打亂排序
      const shuffled = [...newSentences].sort(() => Math.random() - 0.5);
      const reorderedSentences = shuffled.map((item, index) => ({
        ...item,
        id: index + 1,
      }));

      setSentences(reorderedSentences);
      setUserAnswers({});
      setCheckResults([]);
      toast.success(`已生成 ${newSentences.length} 道練習題`);
    } catch (error) {
      toast.error(`生成失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAnswers = () => {
    if (sentences.length === 0) {
      toast.error('請先生成練習題');
      return;
    }

    const results: CheckResult[] = sentences.map(sentence => {
      const userAnswer = (userAnswers[sentence.id - 1] || '').trim().toLowerCase();
      const correct = userAnswer === sentence.word.toLowerCase();
      return {
        word: sentence.word,
        correct,
        userAnswer,
      };
    });

    setCheckResults(results);
    setShowResults(true);

    const correctCount = results.filter(r => r.correct).length;
    const percentage = Math.round((correctCount / results.length) * 100);
    toast.success(`成績: ${correctCount}/${results.length} (${percentage}%)`);
  };

  const resetPractice = () => {
    setUserAnswers({});
    setCheckResults([]);
    setShowResults(false);
  };

  const exportWords = () => {
    const data = { words, timestamp: new Date().toISOString() };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `words-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已導出');
  };

  const importWords = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.words)) {
          const uniqueWords = Array.from(new Set([...words, ...data.words]));
          setWords(uniqueWords);
          toast.success(`已導入 ${data.words.length} 個單字`);
        }
      } catch {
        toast.error('文件格式錯誤');
      }
    };
    reader.readAsText(file);
  };

  const translateSentence = async (sentenceId: number, sentence: string) => {
    setTranslatingId(sentenceId);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sentence)}&langpair=en|zh-TW`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        const translation = data.responseData.translatedText;
        toast.success(`翻譯: ${translation}`);
      } else {
        toast.error('翻譯失敗');
      }
    } catch (error) {
      toast.error('翻譯服務不可用');
    } finally {
      setTranslatingId(null);
    }
  };

  const correctCount = checkResults.filter(r => r.correct).length;
  const totalCount = checkResults.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">單字填空練習</h1>
          <p className="text-gray-600">AI 生成個性化英語練習題</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>添加單字</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addWord()}
                  className="flex-1"
                />
                <Button onClick={addWord} className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加
                </Button>
              </div>

              {words.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {words.map((word, index) => (
                    <Badge key={index} variant="secondary" className="gap-2 px-3 py-1">
                      {word}
                      <button
                        onClick={() => removeWord(index)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px]">
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">簡單</SelectItem>
                      <SelectItem value="medium">中等</SelectItem>
                      <SelectItem value="hard">困難</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateSentences}
                  disabled={words.length === 0 || isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成練習題'
                  )}
                </Button>
                <Button
                  onClick={clearWords}
                  variant="outline"
                  disabled={words.length === 0}
                >
                  清空
                </Button>
                <Button onClick={exportWords} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importWords}
                    className="hidden"
                  />
                  <Button variant="outline" className="gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {sentences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>練習題 ({sentences.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentences.map((sentence, index) => (
                    <div key={sentence.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">#{index + 1}</span>
                          <Badge variant={sentence.aiGenerated ? 'default' : 'secondary'}>
                            {sentence.aiGenerated ? 'AI' : '模板'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => translateSentence(sentence.id, sentence.sentence)}
                          disabled={translatingId === sentence.id}
                          className="gap-1"
                        >
                          <Globe className="w-4 h-4" />
                          {translatingId === sentence.id ? '翻譯中...' : '翻譯'}
                        </Button>
                      </div>

                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {sentence.sentence}
                      </p>

                      <div className="flex gap-2">
                        <Input
                          value={userAnswers[index] || ''}
                          onChange={(e) =>
                            setUserAnswers({ ...userAnswers, [index]: e.target.value })
                          }
                          disabled={showResults}
                          className="flex-1"
                        />
                        {showResults && checkResults[index] && (
                          <div className="flex items-center gap-2">
                            {checkResults[index].correct ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                        )}
                      </div>

                      {showResults && checkResults[index] && !checkResults[index].correct && (
                        <p className="text-sm text-red-600 mt-2">
                          答案: <span className="font-semibold">{sentence.word}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  {!showResults ? (
                    <Button
                      onClick={checkAnswers}
                      disabled={Object.keys(userAnswers).length === 0}
                      className="flex-1"
                    >
                      檢查答案
                    </Button>
                  ) : (
                    <>
                      <Button onClick={resetPractice} variant="outline" className="flex-1">
                        重新練習
                      </Button>
                      <Button onClick={clearWords} className="flex-1">
                        新增單字
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {showResults && checkResults.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">成績統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                    <p className="text-gray-600">正確</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{totalCount - correctCount}</p>
                    <p className="text-gray-600">錯誤</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{percentage}%</p>
                    <p className="text-gray-600">正確率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
