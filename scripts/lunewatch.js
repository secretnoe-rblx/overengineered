const fs = require("fs");
const { exec } = require("child_process");
const path = "./place.rbxl";

let fileCreated = false;
let watcher = null;

function runCommand() {
	console.log("[watcher] Detected change. Running: lune run savechanges");
	exec("lune run savechanges", (error, stdout, stderr) => {
		if (error) {
			console.error(`[watcher] Error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`[watcher] Stderr: ${stderr}`);
			return;
		}
		console.log(`[watcher] Output:\n${stdout}`);
	});
}

function startWatching() {
	if (watcher) return;

	watcher = fs.watch(path, (eventType) => {
		if (eventType === "change") {
			runCommand();
		}
	});

	console.log("[watcher] Watching for changes to place.rbxl");
}

function waitForFile() {
	if (fs.existsSync(path)) {
		console.log("[watcher] place.rbxl already exists. Waiting for next change...");
		fileCreated = true;
		startWatching();
		return;
	}

	console.log("[watcher] place.rbxl not found. Waiting for it to be created...");

	const interval = setInterval(() => {
		if (fs.existsSync(path)) {
			if (!fileCreated) {
				fileCreated = true;
				console.log("[watcher] place.rbxl created (initial). Skipping command...");
				startWatching();
			}
			clearInterval(interval);
		}
	}, 500);
}

waitForFile();
