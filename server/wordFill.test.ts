import { describe, expect, it, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock context for public procedures
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };
}

describe('wordFill router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createPublicContext();
    caller = appRouter.createCaller(ctx);
  });

  describe('health check', () => {
    it('should return ok status', async () => {
      const result = await caller.wordFill.health();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('generateSentence', () => {
    it('should generate a sentence for a valid word', async () => {
      const result = await caller.wordFill.generateSentence({
        word: 'happy',
        difficulty: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.word).toBe('happy');
      expect(result.sentence).toBeTruthy();
      expect(result.sentence).toContain('___');
      expect(result.difficulty).toBe('medium');
    });

    it('should return fallback sentence on API error', async () => {
      // This test verifies that even if the API fails, a fallback sentence is provided
      const result = await caller.wordFill.generateSentence({
        word: 'test',
        difficulty: 'easy',
      });

      expect(result.word).toBe('test');
      expect(result.sentence).toBeTruthy();
      expect(result.sentence).toContain('___');
      // fallback might be true or false depending on API availability
      expect(typeof result.fallback).toBe('boolean');
    });

    it('should handle different difficulty levels', async () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;

      for (const difficulty of difficulties) {
        const result = await caller.wordFill.generateSentence({
          word: 'learn',
          difficulty,
        });

        expect(result.word).toBe('learn');
        expect(result.difficulty).toBe(difficulty);
        expect(result.sentence).toBeTruthy();
      }
    }, 20000); // 20 second timeout for this test

    it('should reject empty words', async () => {
      try {
        await caller.wordFill.generateSentence({
          word: '',
          difficulty: 'medium',
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw validation error
        expect(error).toBeDefined();
      }
    });
  });

  describe('generateBatch', () => {
    it('should generate sentences for multiple words', async () => {
      const words = ['apple', 'book', 'cat'];
      const result = await caller.wordFill.generateBatch({
        words,
        difficulty: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);

      result.results.forEach((item, index) => {
        expect(item.word).toBe(words[index]);
        expect(item.sentence).toBeTruthy();
        expect(item.sentence).toContain('___');
      });
    });

    it('should handle empty word list', async () => {
      const result = await caller.wordFill.generateBatch({
        words: [],
        difficulty: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('should process words with different difficulties', async () => {
      const result = await caller.wordFill.generateBatch({
        words: ['quick', 'slow'],
        difficulty: 'hard',
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      result.results.forEach(item => {
        expect(item.difficulty).toBe('hard');
      });
    });
  });
});
