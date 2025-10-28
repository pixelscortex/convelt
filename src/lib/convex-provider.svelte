<script lang="ts">
	import { ConvexClient } from 'convex/browser';
	import type { Snippet } from 'svelte';
	import { createConvexClient, setConveltManager, setConvex } from './context.js';
	import { onCleanup } from 'runed';
	import { ConveltManager } from './convelt-manager.svelte.js';
	let {
		client = createConvexClient(),
		children
	}: {
		client?: ConvexClient;
		children?: Snippet<[]>;
	} = $props();

	setConvex(client);

	setConveltManager(new ConveltManager());

	onCleanup(() => {
		client.close();
	});
</script>

{@render children?.()}
