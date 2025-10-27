<script lang="ts">
	import ConvexProvider from '$lib/convex-provider.svelte';
	import { ConvexClient } from 'convex/browser';
	import '../app.css';
	import { env } from '$env/dynamic/public';

	let { children } = $props();

	const client = new ConvexClient(env.PUBLIC_CONVEX_URL);
</script>

<ConvexProvider {client}>
	{@render children()}
</ConvexProvider>
