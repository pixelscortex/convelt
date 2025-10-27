/**
 * @description type helper that check if there is no Args and return undefined
 * instead of `Record<string, never>` for example `args: { [x:string]: never }`
 *
 * @example
 * type Result = OptionalIfNever<FunctionArgs<typeof api.query.withNoArgs>>;
 * // Result is undefined
 *
 * @example
 * type Result = OptionalIfNever<FunctionArgs<typeof api.query.withArgs>>;
 * // Result is { something: string, somethingElse: number, somethingElseAgain: boolean }
 *
 */
export type OptionalIfNever<T> = [T] extends [Record<string, never>]
	? [Record<string, never>] extends [T]
		? undefined
		: T
	: T;
