import { LoadingController } from "client/controller/LoadingController";
import type { UnitTests } from "shared/test/TestFramework";

namespace LoadingControllerTests {
	export function loading() {
		LoadingController.show("Testing stuff");
	}
	export function nonLoading() {
		LoadingController.hide();
	}
}
export const _Tests: UnitTests = { LoadingControllerTests };
