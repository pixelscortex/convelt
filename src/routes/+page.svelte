<script lang="ts">
	import { api } from '../convex/_generated/api.js';

	import { Button } from '$lib/ui/elements/button/index.js';
	import { createQuery } from '$lib/create-query.svelte.js';
	import { createMutation } from '$lib/create-mutaion.svelte.js';
	import type { Id } from '../convex/_generated/dataModel.js';

	const tasksGetAll = createQuery(api.tasks.getAll);

	const addTask = createMutation(api.tasks.create, (localStore, args) => {
		const existingTask = localStore.getQuery(api.tasks.getAll);
		if (existingTask !== undefined) {
			const now = Date.now();
			const newTask = {
				_creationTime: now,
				_id: crypto.randomUUID() as Id<'tasks'>,
				category: 'personal',
				completed: false,
				title: args.title
			};
			localStore.setQuery(api.tasks.getAll, {}, [...existingTask, newTask]);
		}
	});
</script>

<Button
	onclick={() => {
		addTask({
			category: 'personal',
			title: `New Task ${Math.random().toString(36).substring(2, 15)}`,
			completed: false
		});
	}}>Add Task</Button
>

<pre>
    {#if tasksGetAll.loading === undefined}
		Disabled
	{:else if tasksGetAll.loading}
		Loading...
	{:else if !tasksGetAll.error}
		{#each tasksGetAll.data as task (task._id)}
			{JSON.stringify(task, null, 2)}
		{/each}
	{/if}
2
</pre>
