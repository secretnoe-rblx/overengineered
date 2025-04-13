import { StarterGui, Workspace } from "@rbxts/services";
import { MusicPlaylist } from "client/controller/sound/MusicPlaylist";
import { HostedService } from "engine/shared/di/HostedService";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class MusicController extends HostedService {
	private readonly musicFolder = (
		StarterGui as unknown as {
			GameUI: {
				Sounds: Folder & {
					Music: Folder &
						Record<string, Folder> & {
							Space: Folder;
							Background: Folder;
						};
				};
			};
		}
	).GameUI.Sounds.Music;

	private readonly spacePlaylist = new MusicPlaylist(this.musicFolder.Space.GetChildren() as Sound[], 15);
	private readonly backgroundPlaylist = new MusicPlaylist(this.musicFolder.Background.GetChildren() as Sound[], 25);
	private readonly allPlaylists: MusicPlaylist[] = [this.spacePlaylist, this.backgroundPlaylist];

	readonly stopAll = () => this.allPlaylists.forEach((v) => v.stop());

	constructor(@inject playerData: PlayerDataStorage) {
		super();

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => {
			if (!playerData.config.get().music) return;

			if (Workspace.Gravity <= 0 && !this.spacePlaylist.currentSound) {
				this.stopAll();
				this.spacePlaylist.play();
				return;
			}

			if (Workspace.Gravity > 0 && this.spacePlaylist.currentSound) {
				this.spacePlaylist.stop();
				this.backgroundPlaylist.play();
				return;
			}
		});

		this.onDisable(this.stopAll);
	}
}
