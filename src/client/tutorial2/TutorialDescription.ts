import type { TutorialStarter } from "client/tutorial2/TutorialStarter";

export interface TutorialDescription {
	readonly name: string;
	readonly description: string;
	readonly start: (tutorial: TutorialStarter, ...args: never[]) => void;
}
