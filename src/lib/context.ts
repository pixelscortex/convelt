import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { ConvexClient, type ConvexClientOptions } from 'convex/browser';
import { createContext } from 'svelte';
import type { ConveltManager } from './convelt-manager.svelte.js';

export const [getConvex, setConvex] = createContext<ConvexClient>();

export function createConvexClient(url?: string, options: ConvexClientOptions = {}) {
	if (!url && !env.PUBLIC_CONVEX_URL) {
		throw new Error('No Convex URL provided and PUBLIC_CONVEX_URL is not set');
	}
	return new ConvexClient(url || env.PUBLIC_CONVEX_URL, {
		...options,
		disabled: !browser
	});
}

export const [getConveltManager, setConveltManager] = createContext<ConveltManager>();
