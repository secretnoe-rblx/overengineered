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
			constrain: (globalDirection, rotation, amount) => {
				const makeUnitWithAxis1 = (vector: Vector3, direction: Vector3) => {
					let axisValue = 0;
					const [x, y, z] = [math.abs(vector.X), math.abs(vector.Y), math.abs(vector.Z)];

					if (direction.X !== 0 && axisValue < x) {
						axisValue = x;
					}
					if (direction.Y !== 0 && axisValue < y) {
						axisValue = y;
					}
					if (direction.Z !== 0 && axisValue < z) {
						axisValue = z;
					}

					return vector.div(axisValue);
				};

				rotation = rotation.Rotation;

				const localAmount = rotation.VectorToObjectSpace(amount);
				const localDirection = rotation.VectorToObjectSpace(globalDirection);

				const max = localDirection.mul(localAmount).Magnitude;
				const stepped = MathUtils.round(max, step);
				const diff = makeUnitWithAxis1(localAmount, localDirection).mul(stepped);

				return rotation.VectorToWorldSpace(diff);
			},
		};
	}
}
