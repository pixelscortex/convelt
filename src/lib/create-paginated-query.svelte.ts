import type {
	DefaultFunctionArgs,
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
	PaginationResult
} from 'convex/server';
import { getConveltManager } from './context.js';
import type { OptionalIfNever } from './type-helper.js';
import type { ResultCallback } from './convelt-manager.svelte.js';
// SvelteMap not needed here
import { onCleanup } from 'runed';
import { untrack } from 'svelte';

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type PaginatedQueryParams<
	Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, PaginationResult<any>>
> = {
	args: OptionalIfNever<Omit<FunctionArgs<Query>, 'paginationOpts'>> | 'skip';
};

/**
 * Creates a reactive, cursor-pinned paginated query configuration.
 *
 * This mimics Convex React's `usePaginatedQuery` behavior: pages are bounded by
 * start/end cursors so inserting/removing items never creates gaps or duplicates.
 *
 * Acknowledgement: Thanks to Pierre-H for the early Svelte prototype that
 * kick-started this implementation — see
 * https://gist.github.com/pierre-H/f5ad9149c591584793addd09f6881105
 *
 * Notes
 * - If the query takes no arguments, the `params` function is optional.
 * - If the query requires arguments, the `params` function is mandatory.
 * - `options.pageSize` determines the page size for all pages (including the first).
 *
 * Basic usage
 * ```ts
 * const tasks = createPaginatedQuery(api.tasks.list, () => ({ args: { listId } }), {
 * 	pageSize: 10
 * });
 *
 * $effect(() => {
 * 	if (!tasks.isLoading && someCondition) tasks.loadMore();
 * });
 *
 * <!-- in markup -->
 * {#each tasks.result as task}
 * 	<div>{task.title}</div>
 * {/each}
 * <button disabled={tasks.isLoading} on:click={tasks.loadMore}>Load more</button>
 * ```
 *
 * Skipping conditionally
 * ```ts
 * const todos = createPaginatedQuery(api.todos.list, () => ({
 * 	args: shouldSkip ? 'skip' : undefined
 * }), { pageSize: 5 });
 * ```
 *
 * With required args
 * ```ts
 * const todoById = createPaginatedQuery(api.todos.get, () => ({
 * 	args: { id }
 * }), { pageSize: 1 });
 * ```
 *
 * Type safety
 * ```ts
 * // Error: args required but missing
 * // const invalid = createPaginatedQuery(api.todos.get);
 * ```
 */
export function createPaginatedQuery<
	Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, PaginationResult<any>>
>(query: Query, params: () => PaginatedQueryParams<Query>, options: { pageSize: number }) {
	const manager = getConveltManager();

	// Map of pageKey -> page data
	let pages: Record<number, FunctionReturnType<Query>['page']> = $state({});
	// Ordered list of page keys
	let pageKeys: number[] = $state([]);
	// Next key generator
	let nextKey = $state(0);

	let isDone = $state(false);
	let continueCursor: string | null = null;
	let loadingPages: Record<number, boolean> = $state({});

	let currentError = $state<Error | null>(null);

	const unsubscribeFns = $state<Record<number, () => void>>({});

	if (typeof query === 'string') {
		throw new Error('Query must be a functionReference object, not a string');
	}

	const args = $derived.by(() => {
		return params().args ?? undefined;
	});

	$effect(() => {
		if (args === 'skip') {
			return;
		}

		// Load first page
		untrack(() => {
			const key = nextKey++;
			pageKeys = [key];
			load(key, null, null);
		});

		onCleanup(() => {
			pages = {};
			pageKeys = [];
			nextKey = 0;
			isDone = false;
			continueCursor = null;
			loadingPages = {};
			currentError = null;

			Object.values(unsubscribeFns).forEach((unsubscribe) => unsubscribe());
		});
	});

	function load(pageKey: number, cursor: string | null, endCursor: string | null) {
		if (args === 'skip') {
			return;
		}

		loadingPages[pageKey] = true;

		const argsWithPagination = {
			...args,
			paginationOpts: {
				cursor,
				numItems: options.pageSize,
				endCursor
			}
		};

		const callback: ResultCallback<PaginationResult<Query>, Error> = (r) => {
			loadingPages[pageKey] = false;
			if (r.error) {
				currentError = r.error;
				return;
			}

			const { data } = r;

			// If the server recommends splitting or returns a splitCursor,
			// replace this page with two new pages bounded by the suggested cursors.
			if (data.splitCursor) {
				// Tear down old subscription
				unsubscribeFns[pageKey]?.();

				const firstKey = nextKey++;
				const secondKey = nextKey++;

				// Replace pageKey in pageKeys with [firstKey, secondKey]
				const idx = pageKeys.findIndex((k) => k === pageKey);
				if (idx !== -1) {
					pageKeys = [...pageKeys.slice(0, idx), firstKey, secondKey, ...pageKeys.slice(idx + 1)];
				}

				// Start the two bounded pages
				load(firstKey, cursor, data.splitCursor);
				load(secondKey, data.splitCursor, data.continueCursor);
				return;
			}

			pages[pageKey] = data.page;

			// If this is the last page currently tracked, advance cursors/done flag
			if (pageKeys.length > 0 && pageKey === pageKeys[pageKeys.length - 1]) {
				isDone = data.isDone;
				continueCursor = data.continueCursor;
			}
		};

		const unsubscribe = manager.track<PaginationResult<Query>, Query, FunctionArgs<Query>>(
			query,
			argsWithPagination,
			callback
		);

		unsubscribeFns[pageKey] = unsubscribe;
	}

	const isLoading = $derived(Object.values(loadingPages).some((loading) => loading));

	function loadMore() {
		if (isDone) return;
		const key = nextKey++;
		pageKeys = [...pageKeys, key];
		load(key, continueCursor, null);
	}

	return {
		loadMore,
		get result() {
			// Concatenate pages in the tracked order
			const ordered: FunctionReturnType<Query>['page'] = [] as any;
			for (const k of pageKeys) {
				const page = pages[k];
				if (page) ordered.push(...page);
			}
			return ordered;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return currentError;
		}
	};
}
