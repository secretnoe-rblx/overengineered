import { GameDefinitions } from "shared/data/GameDefinitions";

export const gameInfo: GameInfo = {
	gameName: `🛠️ Plane Engineers 🛠️`,
	environment: GameDefinitions.isTestPlace() ? "⚠️ Testing" : "✅ Production",
	groupId: GameDefinitions.GROUP,
};
