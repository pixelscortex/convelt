import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { ConvexClient, type ConvexClientOptions } from 'convex/browser';
import { createContext } from 'svelte';

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
