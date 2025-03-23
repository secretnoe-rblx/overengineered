import type { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { SharedPlot } from "shared/building/SharedPlot";

export class RideToBuildModeSlotScheduler {
	private readonly schedules: ((building: ClientBuilding, plot: SharedPlot) => void)[] = [];

	clear() {
		this.schedules.clear();
	}

	schedule(func: (building: ClientBuilding, plot: SharedPlot) => void) {
		this.schedules.push(func);
	}

	execute(building: ClientBuilding, plot: SharedPlot) {
		for (const func of this.schedules) {
			func(building, plot);
		}
	}
}
