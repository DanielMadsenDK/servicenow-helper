import { renderHook, act } from '@testing-library/react';
import { useSessionManager } from '@/hooks/useSessionManager';

// Mock Math.random for consistent testing
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.123456789);
global.Math = mockMath;

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => 1640995200000); // Fixed timestamp
global.Date.now = mockDateNow;

describe('useSessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1640995200000);
    mockMath.random.mockReturnValue(0.123456789);
  });

  describe('Initial State', () => {
    it('should initialize with null session key and false continue mode', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.currentSessionKey).toBeNull();
      expect(result.current.continueMode).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(typeof result.current.getSessionKey).toBe('function');
      expect(typeof result.current.setContinueMode).toBe('function');
      expect(typeof result.current.setCurrentSessionKey).toBe('function');
    });
  });

  describe('Session Key Generation', () => {
    it('should generate session key when getSessionKey is called', () => {
      const { result } = renderHook(() => useSessionManager());

      let sessionKey: string;
      act(() => {
        sessionKey = result.current.getSessionKey();
      });

      expect(sessionKey!).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.currentSessionKey).toBe(sessionKey!);
    });

    it('should generate different session keys on subsequent calls', () => {
      const { result } = renderHook(() => useSessionManager());

      let sessionKey1: string;
      let sessionKey2: string;

      // Mock different timestamps and random values
      mockDateNow.mockReturnValueOnce(1640995200000);
      mockMath.random.mockReturnValueOnce(0.123456789);

      act(() => {
        sessionKey1 = result.current.getSessionKey();
      });

      mockDateNow.mockReturnValueOnce(1640995201000);
      mockMath.random.mockReturnValueOnce(0.987654321);

      act(() => {
        sessionKey2 = result.current.getSessionKey();
      });

      expect(sessionKey1).not.toBe(sessionKey2);
    });

    it('should force new session key when isNewRequest is true', () => {
      const { result } = renderHook(() => useSessionManager());

      let sessionKey1: string;
      let sessionKey2: string;

      act(() => {
        sessionKey1 = result.current.getSessionKey();
      });

      // Mock different values for new session
      mockDateNow.mockReturnValueOnce(1640995201000);
      mockMath.random.mockReturnValueOnce(0.987654321);

      act(() => {
        sessionKey2 = result.current.getSessionKey(true); // Force new request
      });

      expect(sessionKey1).not.toBe(sessionKey2);
      expect(result.current.currentSessionKey).toBe(sessionKey2);
    });
  });

  describe('Continue Mode', () => {
    it('should toggle continue mode', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.continueMode).toBe(false);

      act(() => {
        result.current.setContinueMode(true);
      });

      expect(result.current.continueMode).toBe(true);

      act(() => {
        result.current.setContinueMode(false);
      });

      expect(result.current.continueMode).toBe(false);
    });

    it('should prevent new session ID generation when continue mode is ON - bug regression test', () => {
      const { result } = renderHook(() => useSessionManager());

      // Enable continue mode
      act(() => {
        result.current.setContinueMode(true);
      });

      const persistentSessionKey = result.current.currentSessionKey;
      expect(persistentSessionKey).toMatch(/^session_\d+_[a-z0-9]+$/);

      // Multiple calls to getSessionKey should return SAME session key
      let sessionKey1: string;
      let sessionKey2: string;
      let sessionKey3: string;

      act(() => {
        sessionKey1 = result.current.getSessionKey();
      });

      act(() => {
        sessionKey2 = result.current.getSessionKey();
      });

      act(() => {
        sessionKey3 = result.current.getSessionKey();
      });

      // CRITICAL: All session keys should be identical when continue mode is ON
      expect(sessionKey1).toBe(persistentSessionKey);
      expect(sessionKey2).toBe(persistentSessionKey);
      expect(sessionKey3).toBe(persistentSessionKey);
      expect(sessionKey1).toBe(sessionKey2);
      expect(sessionKey2).toBe(sessionKey3);
    });

    it('should generate new session ID each time when continue mode is OFF', () => {
      const { result } = renderHook(() => useSessionManager());

      // Ensure continue mode is OFF
      expect(result.current.continueMode).toBe(false);

      let sessionKey1: string;
      let sessionKey2: string;

      // Mock different timestamps and random values for each call
      mockDateNow.mockReturnValueOnce(1640995200000);
      mockMath.random.mockReturnValueOnce(0.123456789);

      act(() => {
        sessionKey1 = result.current.getSessionKey();
      });

      mockDateNow.mockReturnValueOnce(1640995201000);
      mockMath.random.mockReturnValueOnce(0.987654321);

      act(() => {
        sessionKey2 = result.current.getSessionKey();
      });

      // When continue mode is OFF, session keys should be different
      expect(sessionKey1).not.toBe(sessionKey2);
      expect(sessionKey1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionKey2).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should generate session key when enabling continue mode without existing key', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.currentSessionKey).toBeNull();

      act(() => {
        result.current.setContinueMode(true);
      });

      expect(result.current.continueMode).toBe(true);
      expect(result.current.currentSessionKey).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should clear session key when disabling continue mode', () => {
      const { result } = renderHook(() => useSessionManager());

      // Enable continue mode first
      act(() => {
        result.current.setContinueMode(true);
      });

      expect(result.current.currentSessionKey).not.toBeNull();

      // Disable continue mode
      act(() => {
        result.current.setContinueMode(false);
      });

      expect(result.current.continueMode).toBe(false);
      expect(result.current.currentSessionKey).toBeNull();
    });

    it('should reuse existing session key in continue mode', () => {
      const { result } = renderHook(() => useSessionManager());

      // Enable continue mode
      act(() => {
        result.current.setContinueMode(true);
      });

      const persistentSessionKey = result.current.currentSessionKey;

      let sessionKey1: string;
      let sessionKey2: string;

      act(() => {
        sessionKey1 = result.current.getSessionKey();
      });

      act(() => {
        sessionKey2 = result.current.getSessionKey();
      });

      expect(sessionKey1).toBe(persistentSessionKey);
      expect(sessionKey2).toBe(persistentSessionKey);
      expect(sessionKey1).toBe(sessionKey2);
    });
  });

  describe('Session Management Integration', () => {
    it('should handle session key setting manually', () => {
      const { result } = renderHook(() => useSessionManager());

      const customSessionKey = 'custom_session_12345';

      act(() => {
        result.current.setCurrentSessionKey(customSessionKey);
      });

      expect(result.current.currentSessionKey).toBe(customSessionKey);
    });

    it('should work with continue mode workflow', () => {
      const { result } = renderHook(() => useSessionManager());

      // Start normal session
      let sessionKey: string;
      act(() => {
        sessionKey = result.current.getSessionKey();
      });

      // Enable continue mode (should not change existing session)
      act(() => {
        result.current.setContinueMode(true);
      });

      expect(result.current.currentSessionKey).toBe(sessionKey);

      // Get session key again (should reuse)
      let continueSessionKey: string;
      act(() => {
        continueSessionKey = result.current.getSessionKey();
      });

      expect(continueSessionKey).toBe(sessionKey);

      // Disable continue mode and get new session
      act(() => {
        result.current.setContinueMode(false);
      });

      expect(result.current.currentSessionKey).toBeNull();

      // Mock different values for new session
      mockDateNow.mockReturnValueOnce(1640995201000);
      mockMath.random.mockReturnValueOnce(0.987654321);

      let newSessionKey: string;
      act(() => {
        newSessionKey = result.current.getSessionKey();
      });

      expect(newSessionKey).not.toBe(sessionKey);
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across re-renders', () => {
      const { result, rerender } = renderHook(() => useSessionManager());

      act(() => {
        result.current.setContinueMode(true);
      });

      const initialSessionKey = result.current.currentSessionKey;
      const initialContinueMode = result.current.continueMode;

      // Re-render the component
      rerender();

      // State should remain consistent
      expect(result.current.currentSessionKey).toBe(initialSessionKey);
      expect(result.current.continueMode).toBe(initialContinueMode);
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useSessionManager());

      // Rapid continue mode changes
      act(() => {
        result.current.setContinueMode(true);
        result.current.setContinueMode(false);
        result.current.setContinueMode(true);
      });

      expect(result.current.continueMode).toBe(true);
      expect(result.current.currentSessionKey).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('API Interface Verification', () => {
    it('should provide consistent API interface', () => {
      const { result } = renderHook(() => useSessionManager());

      // Verify all expected properties and methods are present
      expect(result.current).toHaveProperty('currentSessionKey');
      expect(result.current).toHaveProperty('continueMode');
      expect(result.current).toHaveProperty('setContinueMode');
      expect(result.current).toHaveProperty('getSessionKey');
      expect(result.current).toHaveProperty('setCurrentSessionKey');

      // Verify types
      expect(typeof result.current.continueMode).toBe('boolean');
      expect(typeof result.current.setContinueMode).toBe('function');
      expect(typeof result.current.getSessionKey).toBe('function');
      expect(typeof result.current.setCurrentSessionKey).toBe('function');
    });
  });
});