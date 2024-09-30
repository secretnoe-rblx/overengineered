import { LoadingController } from "client/controller/LoadingController";
import type { UnitTests } from "engine/shared/TestFramework";

namespace LoadingControllerTests {
	export function loading() {
		LoadingController.show("Testing stuff");
	}
	export function nonLoading() {
		LoadingController.hide();
	}
}
export const _Tests: UnitTests = { LoadingControllerTests };
