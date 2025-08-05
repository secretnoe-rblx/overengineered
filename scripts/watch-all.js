const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

let projectRoot = process.cwd();
const argIndex = process.argv.indexOf("--project-root");
if (argIndex !== -1 && process.argv[argIndex + 1]) {
	projectRoot = path.resolve(process.argv[argIndex + 1]);
}

const invocationDir = process.cwd();

const outPath = path.join(projectRoot, "out");
const lunewatchPath = path.join(projectRoot, "scripts", "lunewatch.js");

// Log helper with color
const logMain = (...args) => console.log(chalk.green("[main]"), ...args);

logMain("Project root:   ", projectRoot);
logMain("Invocation dir: ", invocationDir);
logMain("Watching ./out in:", outPath);
logMain("lunewatch path:", lunewatchPath);

function runCommand(label, command, args, cwd) {
	const proc = spawn(command, args, {
		cwd,
		stdio: "pipe",
		shell: true,
	});

	const prefix = `[${label}]`;
	const color = chalk.blue;
	const errorColor = chalk.red;
	const exitColor = chalk.gray;

	proc.stdout.on("data", (data) => {
		process.stdout.write(color(`${prefix} `) + data.toString());
	});

	proc.stderr.on("data", (data) => {
		process.stderr.write(errorColor(`${prefix} ERROR `) + data.toString());
	});

	proc.on("close", (code) => {
		console.log(exitColor(`${prefix} exited with code ${code}`));
	});

	return proc;
}

// 1) npm run watch
runCommand("compile", "npm", ["run", "watch"], invocationDir);

// 2) wait for ./out
function waitForOutFolder() {
	if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
		runCommand("rojo", "npm", ["run", "rojo"], invocationDir);
		return;
	}

	logMain("Waiting for ./out folder...");
	const interval = setInterval(() => {
		if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
			clearInterval(interval);
			logMain("./out folder found. Starting rojo...");
			runCommand("rojo", "npm", ["run", "rojo"], invocationDir);
		}
	}, 500);
}

waitForOutFolder();

// 3) run lunewatch.js
runCommand("assets", "node", [lunewatchPath], projectRoot);
