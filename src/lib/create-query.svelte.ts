import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import { getConveltManager } from './context.js';
import type { OptionalIfNever } from './type-helper.js';
import { onCleanup } from 'runed';
import { convexToJson } from 'convex/values';
import type { ResultCallback } from './convelt-manager.svelte.js';

type QueryParams<Query extends FunctionReference<'query'>> = {
	args: OptionalIfNever<FunctionArgs<Query>> | 'skip';
};

type QueryResult<Query extends FunctionReference<'query'>> =
	| {
			readonly loading: true;
			readonly data: undefined;
			readonly error: undefined;
	  }
	| {
			readonly loading: false;
			readonly data: FunctionReturnType<Query>;
			readonly error: undefined;
	  }
	| {
			readonly loading: false;
			readonly data: undefined;
			readonly error: Error;
	  }
	| {
			readonly loading: undefined;
			readonly data: undefined;
			readonly error: undefined;
	  };

/**
 * Creates a query configuration.
 *
 * - If the query takes no arguments, the `params` function is optional.
 * - If the query requires arguments, the `params` function is mandatory.
 *
 * @example
 * // Valid: No args needed, so params function is optional
 * const allTodos = createQuery(api.todos.list);
 *
 * // Valid: Skip the query conditionally by returning "skip"
 * const skippedTodos = createQuery(api.todos.list, () => ({
 *   args: shouldSkip ? "skip" : undefined
 * }));
 *
 * // Valid: Args are required, so params function is mandatory
 * const todoById = createQuery(api.todos.get, () => ({
 *   args: { id: '123' }
 * }));
 *
 * // Valid: Skip query with args when condition is met
 * const conditionalTodo = createQuery(api.tasks.byId, () => ({
 *   args: randomId ? { id: randomId } : "skip"
 * }));
 *
 * // TypeScript Error: `args` are required but not provided.
 * const invalidTodo = createQuery(api.todos.get);
 */
export function createQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	...params: OptionalIfNever<FunctionArgs<Query>> extends undefined
		? [params?: () => Omit<Partial<QueryParams<Query>>, 'args'>]
		: [params: () => QueryParams<Query>]
) {
	const manager = getConveltManager();

	let result = $state.raw<QueryResult<Query>>({
		data: undefined,
		loading: undefined,
		error: undefined
	});

	const { args } = $derived.by(() => {
		return {
			args: undefined,
			...params[0]?.()
		} satisfies Partial<QueryParams<Query>>;
	});

	if (typeof query === 'string') {
		throw new Error('Query must be a functionReference object, not a string');
	}

	$effect(() => {
		if (args === 'skip') {
			result = {
				data: undefined,
				loading: undefined,
				error: undefined
			};
			return;
		}

		result = {
			data: undefined,
			loading: true,
			error: undefined
		};

		const callback: ResultCallback<FunctionReturnType<Query>, Error> = (r) => {
			// Todo Clean this up make it pretty XD
			result = r.data
				? { data: structuredClone(r.data), error: undefined, loading: false }
				: {
						...r,
						loading: false
					};
		};
		manager.track(query, args, callback);

		onCleanup(() => {
			manager.untrack(query, convexToJson(args ?? {}), callback);
		});
	});

	return {
		get data() {
			return result.data;
		},
		get loading() {
			return result.loading;
		},
		get error() {
			return result.error;
		}
	} as QueryResult<Query>;
}
