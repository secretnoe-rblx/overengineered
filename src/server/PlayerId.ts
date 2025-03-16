/** Player ID type for injection */
export type PlayerId = number & {
	/** @deprecated @hidden */
	readonly ___nominal_PlayerId: unique symbol;
};

export const asPlayerId = (playerId: number): PlayerId => playerId as never;
