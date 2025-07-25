// Mock pg (PostgreSQL) module
const mockPool = {
  connect: jest.fn(),
  on: jest.fn(),
  end: jest.fn(),
  query: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

module.exports = {
  Pool: jest.fn(() => mockPool),
  Client: jest.fn(() => mockClient),
};