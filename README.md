# @pixelscortex/convelt

A Convex client for Svelte that brings React's Convex hooks to Svelte. Built to match the features and developer experience of the React implementation.

## Why I'm Building This

I want Svelte to have the same Convex features and hooks that React enjoys. The official `convex-svelte` package is slow to update and missing functionality that React developers take for granted. This is my attempt to bridge that gap and give Svelte developers feature parity.

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

Under active development. Breaking changes likely as I figure things out. Maintained by 1 person.

## License

MIT
