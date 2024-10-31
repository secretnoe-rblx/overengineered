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
				const localAmount = rotation.VectorToObjectSpace(amount);
				const stepped = localAmount.apply((v) => MathUtils.round(v, step));

				return rotation.VectorToWorldSpace(stepped);
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

export interface ScaleGrid {
	constrain: (localDirection: Vector3, rotation: CFrame, amount: Vector3) => Vector3;
}
export namespace ScaleGrid {
	export const none: ScaleGrid = { constrain: (localDirection, rotation, amount) => amount };
	export const def: ScaleGrid = {
		constrain: (localDirection, rotation, amount) => amount.apply((v) => MathUtils.round(v, 1)),
	};

	export function normal(step: number | undefined): ScaleGrid {
		return {
			constrain: (localDirection, rotation, amount) => {
				const makeUnitWithAxis1 = (vector: Vector3, direction: Vector3) => {
					let axisValue = 0;
					if (direction.X !== 0) axisValue = vector.X;
					else if (direction.Y !== 0) axisValue = vector.Y;
					else if (direction.Z !== 0) axisValue = vector.Z;

					return vector.mul(1 / axisValue);
				};

				const localAmount = rotation.VectorToObjectSpace(amount);

				const max = localDirection.mul(localAmount).Magnitude;
				const stepped = MathUtils.round(max, step);
				const diff = makeUnitWithAxis1(localAmount, localDirection).mul(stepped);

				return rotation.VectorToWorldSpace(diff);
			},
		};
	}
}
