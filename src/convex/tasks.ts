import { v } from 'convex/values';
import { mutation, query } from './_generated/server.js';
import { paginationOptsValidator } from 'convex/server';

// Used to test Query with no Args
export const getAll = query({
	handler: async (ctx) => {
		return await ctx.db.query('tasks').collect();
	}
});

export const byId = query({
	args: {
		id: v.id('tasks')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	}
});

export const create = mutation({
	args: {
		title: v.string(),
		category: v.string(),
		completed: v.boolean()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('tasks', {
			title: args.title,
			category: args.category,
			completed: args.completed
		});
	}
});

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db.query('tasks').paginate(args.paginationOpts);
	}
});
