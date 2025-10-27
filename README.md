# @pixelscortex/convelt

A lightweight, feature-rich Convex client implementation for Svelte. Built because existing solutions don't update fast enough and lack essential features.

## Why This Exists

The official `convex-svelte` package updates slowly and missing key features. This implementation provides faster updates and enhanced functionality.

## Todo

- [x] `createQuery` with conditional skip
- [ ] `createCursorPagination` with conditional skip
- [x] `createMutation` implementation + Optimistic Update
- [ ] `createAction` implementation
- [ ] Better Auth + Convex integration for SvelteKit
- [ ] Composable UI helpers following shadcn/ui patterns
- [ ] Convelte manager - subscription manager and cache manager

## API Reference

### `createQuery`

Creates a reactive query that automatically updates when data changes. Supports conditional skipping and client-side caching.

```typescript
// Basic usage - no arguments needed
const allTodos = createQuery(api.todos.list);

// With arguments
const todoById = createQuery(api.todos.get, () => ({
	args: { id: '123' }
}));

// Conditional skip
const skippedTodos = createQuery(api.todos.list, () => ({
	args: shouldSkip ? 'skip' : undefined
}));

```

### `createMutation`

Creates a mutation function with built-in error handling and optimistic updates support.

```typescript
// Basic mutation
const createTodo = createMutation(api.todos.create);

// With optimistic updates
const updateTodo = createMutation(api.todos.update, {
  // Optimistic update logic
});

// Usage in event handlers
<button onclick={() => createTodo({ text: "New todo" })}>
  Create Todo
</button>
```

## Status

🚧 Under active development. Maintained by 1 person.

## License

MIT
