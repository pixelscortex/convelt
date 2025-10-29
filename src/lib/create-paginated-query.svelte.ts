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
import { SvelteMap } from 'svelte/reactivity';
import { onCleanup } from 'runed';
import { untrack } from 'svelte';

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type PaginatedQueryParams<
	Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, PaginationResult<any>>
> = {
	args: OptionalIfNever<Omit<FunctionArgs<Query>, 'paginationOpts'>> | 'skip';
};

/**
 * Creates a query configuration.
 *	 Thanks to pierre-H https://gist.github.com/pierre-H/f5ad9149c591584793addd09f6881105
 * - If the query takes no arguments, the `params` function is optional.
 * - If the query requires arguments, the `params` function is mandatory.
 *
 * @example
 * // Valid: No args needed, so params function is optional
 * const allTodos = createQuery(api.todos.list);
 *
 * // Valid: Skip the query conditionally by returning "skip"
 * const skippedTodos = createPaginatedQuery(api.todos.list, () => ({
 *   args: shouldSkip ? "skip" : undefined
 * }));
 *
 * // Valid: Args are required, so params function is mandatory
 * const todoById = createPaginatedQuery(api.todos.get, () => ({
 *   args: { id: '123' }
 * }));
 *
 * // Valid: Skip query with args when condition is met
 * const conditionalTodo = createPaginatedQuery(api.tasks.byId, () => ({
 *   args: randomId ? { id: randomId } : "skip"
 * }));
 *
 * // TypeScript Error: `args` are required but not provided.
 * const invalidTodo = createPaginatedQuery(api.todos.get);
 */
export function createPaginatedQuery<
	Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, PaginationResult<any>>
>(
	query: Query,
	params: () => PaginatedQueryParams<Query>,
	options: { initialNumItems: number; pageSize?: number }
) {
	const manager = getConveltManager();

	let pages: Record<number, FunctionReturnType<Query>['page']> = $state({});

	let currentPage = $state(0);

	let isDone = $state(false);
	let currentCursor: string | null = null;
	let loadingPages: Record<number, boolean> = $state({});

	let currentError = $state<Error | null>(null);

	const callbackJournal = new SvelteMap<string, ResultCallback<PaginationResult<Query>, Error>>();

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

		console.log('effect');

		untrack(() => next());

		onCleanup(() => {
			pages = {};
			loadingPages = {};

			callbackJournal.entries().map(([args, callback]) => {
				manager.untrack(query, JSON.parse(args), callback);
			});
		});
	});

	function next() {
		currentPage++;
		load($state.snapshot(currentPage), currentCursor, null);
	}

	function load(queryPage: number, cursor: string | null, endCursor: string | null) {
		if (args === 'skip') {
			return;
		}

		loadingPages[queryPage] = true;

		const argsWithPagination = {
			...args,
			paginationOpts: {
				cursor,
				numItems: options.pageSize ?? 15,
				endCursor
			}
		};

		const callback: ResultCallback<PaginationResult<Query>, Error> = (r) => {
			loadingPages[queryPage] = false;
			if (r.error) {
				currentError = r.error;
				return;
			}

			const { data } = r;

			console.log(data);

			if (data.splitCursor) {
				const unsubscribe = callbackJournal.get(JSON.stringify(argsWithPagination));
				if (unsubscribe) {
					manager.untrack(query, argsWithPagination, unsubscribe);
					callbackJournal.delete(JSON.stringify(argsWithPagination));
				}

				load(queryPage, cursor, data.splitCursor);
				load(queryPage + 0.5, data.splitCursor, data.continueCursor);
				return;
			}

			pages[queryPage] = data.page;

			if (queryPage === Math.max(...Object.keys(pages).map(Number))) {
				isDone = data.isDone;
				currentCursor = data.continueCursor;
			}
		};

		manager.track<PaginationResult<Query>, Query, FunctionArgs<Query>>(
			query,
			argsWithPagination,
			callback
		);

		callbackJournal.set(JSON.stringify(argsWithPagination), callback);
	}

	const isLoading = $derived(Object.values(loadingPages).some((loading) => loading));

	function loadMore() {
		if (!isDone) {
			next();
		}
	}

	return {
		loadMore,
		get result() {
			return Object.values(pages).flat();
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return currentError;
		}
	};
}
