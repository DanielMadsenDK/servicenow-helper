# Contributing to ServiceNow AI Support Tool

Thank you for your interest in contributing! This guide will help you get started with contributing to the ServiceNow AI Support Tool.

## Getting Started

### Prerequisites
- Node.js 22+ 
- Docker and Docker Compose
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/servicenow-aisupporttool.git
   cd servicenow-aisupporttool
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see ENVIRONMENT_VARIABLES.md)
   ```

4. **Start Development Environment**
   ```bash
   docker compose --profile setup up -d
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - n8n (optional): http://localhost:5678

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Your Changes
- Follow the existing code style and patterns
- Add comments for complex logic
- Update documentation if needed
- Follow Next.js 15 and React 19 best practices

### 3. Testing
Run all tests before submitting:

```bash
# Unit tests with coverage
npm test
npm run test:coverage

# Integration tests
npm run test:e2e
npm run test:e2e:ui

# Performance tests
npm run test:performance

# Code quality
npm run lint
npm run type-check
```

### 4. Commit Guidelines
Use conventional commit messages:

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add or update tests
chore: maintenance tasks
```

### 5. Submit Pull Request
1. Push your branch to your fork
2. Create a pull request with a clear description
3. Link any related issues
4. Ensure all tests pass in CI

## Code Style Guidelines

### TypeScript/React
- Use TypeScript for all new code
- Follow existing naming conventions
- Use functional components with hooks
- Implement proper error handling
- Use React.memo for performance optimization where appropriate

### File Structure
- Components: `src/components/`
- Pages: `src/app/`
- Utilities: `src/lib/`
- Tests: `tests/unit/` and `tests/`
- Documentation: `docs/`

### Performance Considerations
- Use dynamic imports for heavy components
- Implement proper code splitting
- Optimize images and assets
- Follow Core Web Vitals best practices

## Testing Guidelines

### Unit Tests (Jest)
- Test individual components in isolation
- Mock external dependencies
- Focus on component behavior and logic
- Location: `tests/unit/`

### Integration Tests (Playwright)
- Test complete user workflows
- Use user-facing selectors (getByRole, getByText)
- Test authentication flows
- Location: `tests/integration.spec.ts`

### Best Practices
- Write tests for new features
- Update tests when modifying existing code
- Follow web-first assertions pattern
- Use descriptive test names

## Documentation

### When to Update Documentation
- New features or functionality
- Changes to environment variables
- Updates to development setup
- API changes

### Documentation Files
- `CLAUDE.md` - Project overview and instructions
- `docs/SETUP.md` - Installation and setup
- `docs/DEVELOPMENT.md` - Development guide
- `docs/TESTING.md` - Testing information
- `docs/ENVIRONMENT_VARIABLES.md` - Environment configuration

## Architecture Considerations

### Core Components
- **Frontend**: Next.js 15.5.2 with App Router
- **Backend**: n8n workflows for AI processing  
- **Database**: PostgreSQL 15.4 with pgvector 0.8.0 for data persistence
- **Authentication**: JWT-based auth system

### Key Patterns
- JWT authentication with httpOnly cookies
- Settings management with React context
- Dynamic imports and lazy loading
- Comprehensive error boundaries
- Security headers and CSRF protection

## Security Guidelines

- Never commit API keys or secrets
- Follow security best practices for authentication
- Implement proper input validation
- Use security headers appropriately
- Test for common security vulnerabilities

## Code Review Process

### What We Look For
- Code quality and maintainability
- Test coverage for new features
- Documentation updates
- Performance considerations
- Security implications
- Accessibility compliance

### Review Checklist
- [ ] Tests pass (unit and integration)
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No security issues
- [ ] Performance impact considered
- [ ] Accessibility maintained

## Getting Help

- Check existing issues and documentation
- Ask questions in pull request discussions
- Reference the codebase patterns for guidance
- Follow Next.js and React best practices

## Recognition

Contributors will be recognized in:
- Git commit history
- Release notes for significant contributions
- Project documentation

Thank you for contributing to the ServiceNow AI Support Tool!
