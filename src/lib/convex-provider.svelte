<script lang="ts">
	import { ConvexClient } from 'convex/browser';
	import type { Snippet } from 'svelte';
	import { createConvexClient, setConvex } from './context.js';
	import { onCleanup } from 'runed';
	let {
		client = createConvexClient(),
		children
	}: {
		client?: ConvexClient;
		children?: Snippet<[]>;
	} = $props();

	setConvex(client);

	onCleanup(() => {
		client.close();
	});
</script>

{@render children?.()}
