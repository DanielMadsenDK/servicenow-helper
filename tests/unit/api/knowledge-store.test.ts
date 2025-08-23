/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/knowledge-store/route';
import { DELETE as DELETE_BY_ID, GET as GET_BY_ID } from '@/app/api/knowledge-store/[id]/route';

// Mock the auth module
jest.mock('@/lib/server-auth', () => ({
  getServerAuthState: jest.fn(),
}));

import { getServerAuthState } from '@/lib/server-auth';
const mockGetServerAuthState = getServerAuthState as jest.MockedFunction<typeof getServerAuthState>;

// Mock the N8NClient
const mockClient = {
  getAllQAPairs: jest.fn(),
  deleteQAPair: jest.fn(),
  deleteMultipleQAPairs: jest.fn(),
  getQAById: jest.fn(),
};

jest.mock('@/lib/n8n-client', () => ({
  N8NClient: {
    getInstance: jest.fn(() => mockClient),
  },
}));

describe('/api/knowledge-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/knowledge-store', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: false });

      const request = new NextRequest('http://localhost:3000/api/knowledge-store');
      const response = await GET(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
    });

    it('should return knowledge store items successfully', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      const mockItems = [
        {
          id: 1,
          question: 'Test question',
          answer: 'Test answer',
          category: 'general',
          tags: ['test'],
          quality_score: 5.0,
          usage_count: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          question_embedding: null,
          answer_embedding: null,
        }
      ];

      mockClient.getAllQAPairs.mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/knowledge-store?limit=20&offset=0');
      const response = await GET(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(mockClient.getAllQAPairs).toHaveBeenCalledWith(20, 0);
    });

    it('should handle N8N client errors', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      mockClient.getAllQAPairs.mockRejectedValue(new Error('N8N connection failed'));

      const request = new NextRequest('http://localhost:3000/api/knowledge-store');
      const response = await GET(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/knowledge-store (bulk)', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: false });

      const request = new NextRequest('http://localhost:3000/api/knowledge-store', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2] })
      });
      const response = await DELETE(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
    });

    it('should delete multiple items successfully', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      mockClient.deleteMultipleQAPairs.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/knowledge-store', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] })
      });
      const response = await DELETE(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(mockClient.deleteMultipleQAPairs).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should return 400 for invalid ids', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });

      const request = new NextRequest('http://localhost:3000/api/knowledge-store', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [] })
      });
      const response = await DELETE(request);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/knowledge-store/[id]', () => {
    it('should delete single item successfully', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      mockClient.deleteQAPair.mockResolvedValue(true);

      const response = await DELETE_BY_ID(
        new NextRequest('http://localhost:3000/api/knowledge-store/1'),
        { params: Promise.resolve({ id: '1' }) }
      );
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(mockClient.deleteQAPair).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid ID', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });

      const response = await DELETE_BY_ID(
        new NextRequest('http://localhost:3000/api/knowledge-store/invalid'),
        { params: Promise.resolve({ id: 'invalid' }) }
      );
      
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/knowledge-store/[id]', () => {
    it('should return single item successfully', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      const mockItem = {
        id: 1,
        question: 'Test question',
        answer: 'Test answer',
        category: 'general',
        tags: ['test'],
        quality_score: 5.0,
        usage_count: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        question_embedding: null,
        answer_embedding: null,
      };

      mockClient.getQAById.mockResolvedValue(mockItem);

      const response = await GET_BY_ID(
        new NextRequest('http://localhost:3000/api/knowledge-store/1'),
        { params: Promise.resolve({ id: '1' }) }
      );
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(mockClient.getQAById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when item not found', async () => {
      mockGetServerAuthState.mockResolvedValue({ isAuthenticated: true });
      mockClient.getQAById.mockResolvedValue(null);

      const response = await GET_BY_ID(
        new NextRequest('http://localhost:3000/api/knowledge-store/999'),
        { params: Promise.resolve({ id: '999' }) }
      );
      
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
    });
  });
});