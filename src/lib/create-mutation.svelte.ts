import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from 'convex/server';
import { getConvex } from './context.js';
import type { OptimisticUpdate } from 'convex/browser';
import type { Value } from 'convex/values';

export function createMutation<Mutation extends FunctionReference<'mutation'>>(
	mutation: Mutation,
	/* eslint-disable  @typescript-eslint/no-explicit-any */
	update?: OptimisticUpdate<any>
) {
	const client = getConvex();

	function mutationFn(args?: Record<string, Value>) {
		assertNotSvelteEvent(args);
		return client.mutation(mutation, args, {
			optimisticUpdate: update
		});
	}

	return mutationFn as (
		...args: OptionalRestArgs<Mutation>
	) => Promise<FunctionReturnType<Mutation>>;
}

/**
 * Asserts that the value passed is not a DOM Event object.
 *
 * In Svelte, event handlers like `onclick`
 * receive a DOM Event object as their first argument. This function detects
 * this common mistake and provides a clear, well-formatted error message.
 *
 * @param {any} value - The first argument passed to the function.
 */
function assertNotSvelteEvent(value: any) {
	// Check for properties characteristic of a DOM Event object. This logic
	if (
		typeof value === 'object' &&
		value !== null &&
		typeof value.preventDefault === 'function' &&
		typeof value.stopPropagation === 'function' &&
		value.target !== undefined &&
		'bubbles' in value &&
		value.constructor.name !== 'Object'
	) {
		// A well-formatted, multi-line error message using template literals.
		throw new Error(`
Convex function called with a DOM Event object.

This usually happens when you pass a mutation directly to an event handler
instead of calling it inside a new function. Event objects cannot be sent to
the Convex backend.

INCORRECT USAGE:
  <button onclick={myMutation}>...</button>

CORRECT USAGE:
Wrap your function call in an arrow function to prevent the Event object
from being passed as an argument.

  <button onclick={() => myMutation({ text: "hello" })}>...</button>
`);
	}
}
