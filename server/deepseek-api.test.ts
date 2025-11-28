import { describe, expect, it } from 'vitest';

describe('DeepSeek API Configuration', () => {
  it('should have DEEPSEEK_API_KEY configured', () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^sk-/);
  });

  it('should be able to call DeepSeek API with valid key', async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn('DEEPSEEK_API_KEY not configured, skipping API test');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Say hello in one word.',
        },
      ],
      max_tokens: 10,
      temperature: 0.7,
      stream: false,
    };

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        throw new Error('Invalid API Key - Authentication failed');
      }

      if (response.status === 403) {
        throw new Error('API Key has insufficient permissions or quota');
      }

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.choices).toBeDefined();
      expect(result.choices.length).toBeGreaterThan(0);
      expect(result.choices[0].message.content).toBeTruthy();

      console.log('✅ DeepSeek API Key is valid and working');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ DeepSeek API Error:', error.message);
        throw error;
      }
      throw error;
    }
  });
});
