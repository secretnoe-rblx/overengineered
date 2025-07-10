function unhex(str: string) {
	return str.gsub("..", (cc) => string.char(tonumber(cc, 16)!))[0];
}

const PREFIX = "xAy";
const SUFFIX = "Zz";

const PERMUTATION = [7, 2, 11, 4, 0, 14, 8, 13, 1, 15, 6, 10, 5, 9, 3, 12];
const INVERSE_PERM: number[] = [];
for (let i = 1; i < PERMUTATION.size() + 1; i++) {
	INVERSE_PERM[PERMUTATION[i - 1]] = i;
}

export function decodeJoinMode(encoded: string) {
	if (!encoded.find("^" + PREFIX)[0] || !encoded.find(SUFFIX + "$")[0]) {
		throw "Invalid encoded format";
	}

	const core = encoded.sub(PREFIX.size() + 1, -SUFFIX.size() - 1);

	const reordered = [];
	for (let i = 0; i < INVERSE_PERM.size(); i++) {
		const pos = INVERSE_PERM[i];
		reordered[i] = core.sub(pos, pos);
	}
	const original_order = reordered.join("");

	const hex_part = original_order.sub(1, 8);

	const bytes = unhex(hex_part);
	if (bytes.size() !== 4) {
		throw "Invalid HEX data";
	}

	const ip = [];
	for (let i = 1; i <= 4; i++) {
		ip.push(tostring(bytes.byte(i)[0]));
	}

	return ip.join(".");
}
