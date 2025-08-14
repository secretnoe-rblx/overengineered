declare global {
	interface Color4 {
		readonly color: Color3;
		readonly alpha: number;
	}
}

export namespace Color4 {
	export function toHex(color: Color4): string {
		return `${color.color.ToHex()}${string.format("%X", math.round(math.clamp(color.alpha, 0, 1) * 255))}`;
	}
	export function fromHex(hex: string): Color4 {
		if (hex.startsWith("#")) {
			hex = hex.sub(2);
		}

		const hexSize = hex.size();
		if (hexSize === 3 || hexSize === 6) {
			return { color: Color3.fromHex(hex), alpha: 1 };
		}

		if (hexSize === 7) {
			const [colorHex, alphaHex] = [hex.sub(1, 6), hex.sub(7, 7)];
			return { color: Color3.fromHex(colorHex), alpha: (tonumber(alphaHex, 16) ?? 255) / 255 };
		}
		if (hexSize === 4 || hexSize === 8) {
			const [colorHex, alphaHex] =
				hexSize === 4 //
					? [hex.sub(1, 3), string.rep(hex.sub(4, 4), 2)]
					: [hex.sub(1, 6), hex.sub(7, 8)];

			return { color: Color3.fromHex(colorHex), alpha: (tonumber(alphaHex, 16) ?? 255) / 255 };
		}

		// ffffff0

		throw `Unknown color ${hex}`;
	}
}
