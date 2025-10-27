import { v } from 'convex/values';
import { query } from './_generated/server.js';

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
