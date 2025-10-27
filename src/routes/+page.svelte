<script lang="ts">
	import { api } from '../convex/_generated/api.js';

	import type { Id } from '../convex/_generated/dataModel.js';
	import { Button } from '$lib/ui/elements/button/index.js';
	import { createQuery } from '$lib/create-query.svelte.js';

	let randomId = $state('Math.random().toString()');
	let disabled = $state(false);
	createQuery(api.tasks.byId, () => ({
		args: {
			id: randomId as Id<'tasks'>
		}
	}));

	const tasksGetAll = createQuery(api.tasks.getAll);

	$effect(() => {
		$inspect(tasksGetAll);
	});
</script>

<pre>
    {#if tasksGetAll.loading === undefined}
		Disabled
	{:else if tasksGetAll.loading}
		Loading...
	{:else if !tasksGetAll.error}
		{#each tasksGetAll.data as task (task._id)}
			{JSON.stringify(task, null, '\t')}
		{/each}
	{/if}

</pre>
{tasksGetAll.data?.length}

<Button
	onclick={() => {
		randomId = Math.random().toString();
	}}
>
	Change Args
</Button>

{randomId}

<Button
	onclick={() => {
		disabled = !disabled;
	}}
>
	Disable {disabled ? 'Enabled' : 'Disabled'}
</Button>
