/**
 * @jest-environment node
 */

import axios from 'axios';
import { N8NClient } from '@/lib/n8n-client';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up environment variables - using a URL that results in correct base URL
  process.env = {
    ...originalEnv,
    N8N_WEBHOOK_URL: 'http://localhost:5678/test',
    N8N_API_KEY: 'test-api-key'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('N8NClient - Knowledge Store Methods', () => {
  let client: N8NClient;

  beforeEach(() => {
    client = N8NClient.getInstance();
  });

  describe('deleteQAPair', () => {
    it('should successfully delete a QA pair', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      const result = await client.deleteQAPair(123);

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/deleteKnowledgeStoreId',
        { id: 123 },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }),
          timeout: 30000
        })
      );
    });

    it('should handle API errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await client.deleteQAPair(123);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'N8N webhook error for deleteKnowledgeStoreId:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle unsuccessful responses', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: false, error: 'Item not found' }
      });

      const result = await client.deleteQAPair(123);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete QA pair:',
        'Item not found'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteMultipleQAPairs', () => {
    it('should successfully delete multiple QA pairs', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      const ids = [1, 2, 3, 4, 5];
      const result = await client.deleteMultipleQAPairs(ids);

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/deleteKnowledgeStoreIds',
        { ids },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }),
          timeout: 30000
        })
      );
    });

    it('should handle empty array', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      const result = await client.deleteMultipleQAPairs([]);

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/deleteKnowledgeStoreIds',
        { ids: [] },
        expect.any(Object)
      );
    });

    it('should handle API errors for bulk delete', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAxios.post.mockRejectedValue(new Error('Network timeout'));

      const result = await client.deleteMultipleQAPairs([1, 2, 3]);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete multiple QA pairs:',
        'Network timeout'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle unsuccessful bulk delete response', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: false, error: 'Some items could not be deleted' }
      });

      const result = await client.deleteMultipleQAPairs([1, 2, 3]);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete multiple QA pairs:',
        'Some items could not be deleted'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('integration with existing methods', () => {
    it('should work alongside existing getAllQAPairs method', async () => {
      // Mock successful responses for both methods
      mockAxios.post
        .mockResolvedValueOnce({
          status: 200,
          data: [{ id: 1, question: 'Test', answer: 'Test answer' }]
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { success: true }
        });

      const items = await client.getAllQAPairs();
      const deleteResult = await client.deleteQAPair(1);

      expect(items).toBeDefined();
      expect(deleteResult).toBe(true);
    });
  });
});