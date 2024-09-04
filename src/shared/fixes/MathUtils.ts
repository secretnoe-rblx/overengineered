export namespace MathUtils {
	export const e = 2.718281828459;

	export function round(value: number, step: number | undefined): number {
		if (step === undefined || step === 0) {
			return value;
		}

		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
	export function clamp(value: number, min: number, max: number, step: number | undefined) {
		return math.clamp(round(value, step), min, max);
	}
}
