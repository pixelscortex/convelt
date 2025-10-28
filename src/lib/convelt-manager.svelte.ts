import type { ConvexClient } from 'convex/browser';
import {
	getFunctionName,
	type FunctionArgs,
	type FunctionReference,
	type FunctionReturnType
} from 'convex/server';
import { convexToJson } from 'convex/values';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { getConvex } from './context.js';

type Identifier = string;

type Result<D, E> = {
	data: D | undefined;
	error: E | undefined;
};

export class ConveltManager {
	#client = getConvex();

	#activeSubscriptions = new SvelteMap<
		string,
		{
			// reference counting
			listeners: SvelteSet<
				(result: Result<FunctionReturnType<FunctionReference<'query'>>, Error>) => void
			>;
			unsubscribeFn: ReturnType<ConvexClient['onUpdate']>;
		}
	>();

	track<Query extends FunctionReference<'query'>>(
		query: Query,
		args: FunctionArgs<Query>,
		callback: (result: Result<FunctionReturnType<Query>, Error>) => void
	) {
		const identifier = getIdentifier(query, args);

		if (this.#activeSubscriptions.has(identifier)) {
			this.#activeSubscriptions.get(identifier)?.listeners.add(callback);
			return;
		}

		this.#activeSubscriptions.set(identifier, {
			listeners: new SvelteSet([callback]),
			unsubscribeFn: this.#client.onUpdate(
				query,
				convexToJson(args ?? {}),
				(data) => this.#callListener(identifier, data, undefined),
				(error) => this.#callListener(identifier, undefined, error)
			)
		});
	}

	untrack<Query extends FunctionReference<'query'>>(
		query: Query,
		args: FunctionArgs<Query>,
		callback: (result: Result<FunctionReturnType<Query>, Error>) => void
	) {
		const identifier = getIdentifier(query, args);
		const subscription = this.#activeSubscriptions.get(identifier);
		if (!subscription) return;
		subscription.listeners.delete(callback);
		if (subscription.listeners.size === 0) {
			subscription.unsubscribeFn();
			this.#activeSubscriptions.delete(identifier);
		}
	}

	#callListener<Query extends FunctionReference<'query'>>(
		identifier: Identifier,
		data: FunctionReturnType<Query>,
		error: Error | undefined
	) {
		this.#activeSubscriptions
			.get(identifier)
			?.listeners.forEach((listener) => listener({ data, error }));
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
