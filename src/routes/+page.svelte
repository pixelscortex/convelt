<script lang="ts">
	import { api } from '../convex/_generated/api.js';

	import { Button } from '$lib/ui/elements/button/index.js';
	import { createQuery } from '$lib/create-query.svelte.js';
	import { createMutation } from '$lib/create-mutation.svelte.js';
	import type { Id } from '../convex/_generated/dataModel.js';
	import { createPaginatedQuery } from '$lib/create-paginated-query.svelte.js';

	const tasksGetAll = createQuery(api.tasks.getAll);

	const tasksGetAll2 = createQuery(api.tasks.getAll);

	const paginatedQuery = createPaginatedQuery(
		api.tasks.list,
		() => ({
			args: {
				category: 'personal'
			}
		}),
		{
			pageSize: 2
		}
	);

	const addTask = createMutation(api.tasks.create, (localStore, args) => {
		// const existingTask = localStore.getQuery(api.tasks.getAll);
		// if (existingTask !== undefined) {
		// 	const now = Date.now();
		// 	const newTask = {
		// 		_creationTime: now,
		// 		_id: crypto.randomUUID() as Id<'tasks'>,
		// 		category: 'personal',
		// 		completed: false,
		// 		title: args.title
		// 	};
		// 	localStore.setQuery(api.tasks.getAll, {}, [...existingTask, newTask]);
		// }
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

<Button
	onclick={() => {
		paginatedQuery.loadMore();
	}}>Next</Button
>

<ul class="flex flex-col gap-2">
	{#each paginatedQuery.result as task, index (index)}
		<li>
			{task.title}
		</li>
	{/each}
</ul>
<div class="flex gap-2">
	<!-- <pre>
        {#if tasksGetAll.loading === undefined}
			Disabled
		{:else if tasksGetAll.loading}
			Loading...
		{:else if !tasksGetAll.error}
			{#each tasksGetAll.data as task (task._id)}
				{JSON.stringify(task, null, 2)}
			{/each}
		{/if}

    </pre>

	<pre>
        {#if tasksGetAll2.loading === undefined}
			Disabled
		{:else if tasksGetAll2.loading}
			Loading...
		{:else if !tasksGetAll2.error}
			{#each tasksGetAll2.data as task (task._id)}
				{JSON.stringify(task, null, 2)}
			{/each}
		{/if}
    </pre> -->
</div>
