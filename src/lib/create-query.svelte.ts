import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import { getConvex } from './context.js';
import type { OptionalIfNever } from './type-helper.js';
import { onCleanup } from 'runed';
import { convexToJson } from 'convex/values';

type QueryParams<Query extends FunctionReference<'query'>> = {
	args: OptionalIfNever<FunctionArgs<Query>>;
};

type CreateQueryResult<Query extends FunctionReference<'query'>> =
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
 * // Valid: No args needed, but we want to disable it
 * const disabledTodos = createQuery(api.todos.list, () => ({
 *   disabled: true
 * }));
 *
 * // Valid: Args are required, so params function is mandatory
 * const todoById = createQuery(api.todos.get, () => ({
 *   args: { id: '123' }
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
	const client = getConvex();

	let result = $state.raw<CreateQueryResult<Query>>({
		data: undefined,
		loading: true,
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
		const unsubscribe = client.onUpdate(
			query,
			convexToJson(args ?? {}),
			(d) => {
				result = {
					data: structuredClone(d),
					loading: false,
					error: undefined
				};
			},
			(error) => {
				result = {
					data: undefined,
					loading: false,
					error: error
				};
			}
		);
		onCleanup(() => {
			unsubscribe?.();
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
	} as CreateQueryResult<Query>;
}
