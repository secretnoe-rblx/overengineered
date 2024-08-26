type Replace<T, TKey extends keyof T, TValue> = Reconstruct<Omit<T, TKey> & { readonly [k in TKey]: TValue }>;
type ReplaceWith<T, TProps extends { readonly [k in keyof T | string]?: unknown }> = Reconstruct<
	Omit<T, keyof TProps & keyof T> & TProps
>;

type MakePartial<T, TKey extends keyof T> = Reconstruct<Omit<T, TKey> & { [k in TKey]?: T[k] }>;
type MakeRequired<T, TKey extends keyof T> = Reconstruct<Omit<T, TKey> & { [k in TKey]-?: T[k] & defined }>;

type OmitOverUnion<T, K extends keyof T> = T extends T ? Omit<T, K> : never;
