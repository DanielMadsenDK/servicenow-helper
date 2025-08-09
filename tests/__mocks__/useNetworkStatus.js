// Mock for useNetworkStatus hook
const mockUseNetworkStatus = jest.fn(() => ({
  isOnline: true,
  connectionType: 'wifi',
  effectiveType: '4g',
  downlink: 10,
  rtt: 100,
  saveData: false,
}));

module.exports = {
  useNetworkStatus: mockUseNetworkStatus,
};