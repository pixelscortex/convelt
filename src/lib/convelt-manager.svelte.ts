import type { ConvexClient } from 'convex/browser';
import {
	getFunctionName,
	type DefaultFunctionArgs,
	type FunctionArgs,
	type FunctionReference,
	type FunctionReturnType
} from 'convex/server';
import { convexToJson } from 'convex/values';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { getConvex } from './context.js';

type Identifier = string;

export type ResultCallback<T, E> = (
	result: { data: T; error: undefined } | { data: undefined; error: E }
) => void;

export class ConveltManager {
	#client = getConvex();

	#activeSubscriptions = new SvelteMap<
		string,
		{
			// reference counting
			/* eslint-disable  @typescript-eslint/no-explicit-any */
			listeners: SvelteSet<ResultCallback<any, Error>>;
			unsubscribeFn: ReturnType<ConvexClient['onUpdate']>;
		}
	>();

	track<
		Result,
		Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, Result>,
		Args extends FunctionArgs<Query>
	>(query: Query, args: Args, callback: ResultCallback<Result, Error>) {
		const identifier = getIdentifier(query, args);

		if (this.#activeSubscriptions.has(identifier)) {
			this.#activeSubscriptions.get(identifier)?.listeners.add(callback);

			return () => this.untrack(query, args, callback);
		}

		this.#activeSubscriptions.set(identifier, {
			listeners: new SvelteSet([callback]),
			unsubscribeFn: this.#client.onUpdate(
				query,
				args ?? {},
				(data) =>
					this.#callListener<Result, Query, FunctionReturnType<Query>>(identifier, data, undefined),
				(error) =>
					this.#callListener<Result, Query, FunctionReturnType<Query>>(identifier, undefined, error)
			)
		});

		return () => this.untrack(query, args, callback);
	}

	untrack<
		Result,
		Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, Result>,
		Args extends FunctionArgs<Query>
	>(query: Query, args: Args, callback: ResultCallback<Result, Error>) {
		const identifier = getIdentifier(query, args);
		const subscription = this.#activeSubscriptions.get(identifier);
		if (!subscription) return;
		subscription.listeners.delete(callback);
		if (subscription.listeners.size === 0) {
			subscription.unsubscribeFn();
			this.#activeSubscriptions.delete(identifier);
		}
	}

	#callListener<
		Result,
		Query extends FunctionReference<'query', 'public', DefaultFunctionArgs, Result>,
		Data extends FunctionReturnType<Query>
	>(identifier: Identifier, data: Data | undefined, error: Error | undefined) {
		this.#activeSubscriptions
			.get(identifier)
			?.listeners.forEach((listener) => listener({ data, error } as any));
	}
}

export function getIdentifier<Query extends FunctionReference<'query'>>(
	query: Query,
	args: FunctionArgs<Query>
): Identifier {
	const queryName = getFunctionName(query);
	const argsString = JSON.stringify(convexToJson(args ?? {}));
	return `${queryName}:${argsString}`;
}
