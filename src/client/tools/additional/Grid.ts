import { MathUtils } from "engine/shared/fixes/MathUtils";

export interface MoveGrid {
	constrain: (rotation: CFrame, amount: Vector3) => Vector3;
}
export namespace MoveGrid {
	export const none: MoveGrid = { constrain: (rotation, amount) => amount };
	export const def: MoveGrid = { constrain: (rotation, amount) => amount.apply((v) => MathUtils.round(v, 1)) };

	export function normal(step: number | undefined): MoveGrid {
		return {
			constrain: (rotation, amount) => {
				{
					const localAmount = rotation.VectorToObjectSpace(amount);
					const stepped = localAmount.apply((v) => MathUtils.round(v, step));

					return rotation.VectorToWorldSpace(stepped);
				}
			},
		};
	}
}

export interface RotateGrid {
	constrain: (amountRad: number) => number;
}
export namespace RotateGrid {
	export const none: RotateGrid = { constrain: (amountRad) => amountRad };
	export const def: RotateGrid = { constrain: (amount) => MathUtils.round(amount, 1) };

	export function normal(stepRad: number | undefined): RotateGrid {
		return {
			constrain: (amountRad) => MathUtils.round(amountRad, stepRad),
		};
	}
}
