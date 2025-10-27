# AGENTS.md

## Build/Lint/Test Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run prettier + eslint
pnpm format           # Auto-format code with prettier
pnpm check            # Type check with svelte-check

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:unit -- path/to/test.spec.ts  # Run single test file
```

## Code Style Guidelines

- **Formatting**: Use tabs, single quotes, no trailing commas, 100 char line width
- **Imports**: Use ES modules, prefer relative imports within src/
- **Types**: Strict TypeScript enabled, use explicit types for exports
- **Svelte**: Follow Svelte 5 conventions, use runes ($state, $derived, etc.)
- **Error Handling**: Use try-catch for async operations, proper error boundaries
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Testing**: Use Vitest with browser testing for Svelte components, node for logic
