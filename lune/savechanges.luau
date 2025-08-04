--[[
  Place Extractor Script
  Reads a Roblox place file (`.rbxl`) and a `structure.json` manifest.
  It finds the instances specified in the manifest within the place file
  and serializes them back into individual .rbxm/.rbxmx model files.
]]

-- Required modules
local fs = require("@lune/fs")
local roblox = require("@lune/roblox")
local serde = require("@lune/serde")

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------
local CONFIG = {
	-- Enable/disable debug messages
	Debug = true,

	-- Path to the structure manifest file
	ManifestPath = "./lune/structure.json",

	-- Path to the input .rbxl file from which models will be extracted
	InputPath = "place.rbxl",
}

--------------------------------------------------------------------------------
-- State and Helper Functions
--------------------------------------------------------------------------------
local missingInstances = {} -- Table for storing paths to objects not found in the .rbxl file
local criticalErrors = {}   -- Table for storing critical errors

-- Simplified logging function
local function log(message, depth)
	if CONFIG.Debug then
		depth = depth or 0
		print(("[DEBUG] %s%s"):format(string.rep("  ", depth), tostring(message)))
	end
end

-- Warning function (always displayed)
local function warn(message, depth)
	depth = depth or 0
	local fullMessage = ("[WARN] %s%s"):format(string.rep("  ", depth), tostring(message))
	print(fullMessage)
end

-- Critical error function (always displayed and saved)
local function error(message)
	print("[ERROR] " .. tostring(message))
	table.insert(criticalErrors, message)
end

-- Helper function for protected calls
local function protectedCall(func, errorMessage, ...)
	local success, result = pcall(func, ...)
	if not success then
		error(errorMessage .. ": " .. tostring(result))
	end
	return success, result
end

-- Utility to create the directory in which the file should reside
local function ensureDirectoryExists(filePath)
	-- Extract the directory path from the full file path
	local dirPath = filePath:match("(.+)/")
	if dirPath then
		-- fs.writeDir creates the directory if it does not exist, and does nothing if it already exists.
		fs.writeDir(dirPath)
	end
end


-- Saves a single Instance to a file, automatically determining the format (binary or XML)
local function saveInstanceToFile(instance, filePath, depth)
	-- Check the file extension to determine if XML format should be used
	local isXml = filePath:lower():match("%.rbxmx$")

	if isXml then
		log("Serializing '" .. instance:GetFullName() .. "' to " .. filePath .. " (XML format)", depth)
	else
		log("Serializing '" .. instance:GetFullName() .. "' to " .. filePath .. " (binary format)", depth)
	end

	ensureDirectoryExists(filePath)

	-- roblox.serializeModel expects a table of instances.
	-- If isXml is true, XML format will be used, otherwise binary.
	local success, data = protectedCall(
		roblox.serializeModel,
		"Failed to serialize instance " .. instance:GetFullName(),
		{ instance },
		isXml
	)
	if not success then return false end

	success, _ = protectedCall(fs.writeFile, "Failed to write file " .. filePath, filePath, data)
	return success
end

-- Recursively processes a node from the manifest, finding the corresponding Instance in the game
local function processNode(node, parentInstance, depth)
	local instanceName = node.name
	if not instanceName then
		warn("Invalid manifest node: missing 'name' key.", depth)
		return
	end

	log("Looking for instance: '" .. instanceName .. "' in " .. parentInstance:GetFullName(), depth)

	local childInstance = parentInstance:FindFirstChild(instanceName)

	if not childInstance then
		local fullPath = parentInstance:GetFullName() .. "." .. instanceName
		warn("Could not find instance: " .. fullPath, depth)
		table.insert(missingInstances, fullPath)
		return
	end

	if node.path then
		-- This is a file node, it needs to be saved
		saveInstanceToFile(childInstance, node.path, depth + 1)
	elseif node.children then
		-- This is a folder node, recursively process its children
		for _, childNode in ipairs(node.children) do
			processNode(childNode, childInstance, depth + 1)
		end
	end
end

local function main()
	log("Starting place extraction process...")

	-- 1. Reading and parsing the manifest
	log("Reading manifest from: " .. CONFIG.ManifestPath)
	local manifestJson, readErr = fs.readFile(CONFIG.ManifestPath)
	if not manifestJson then
		error("Failed to read manifest file '" .. CONFIG.ManifestPath .. "': " .. tostring(readErr))
		return false
	end

	local success, manifest = protectedCall(serde.decode, "Failed to parse manifest JSON", "json", manifestJson)
	if not success then return false end
	log("Manifest parsed successfully.")

	-- 2. Reading and deserializing the .rbxl file
	log("Reading place file from: " .. CONFIG.InputPath)
	local placeData, readErr = fs.readFile(CONFIG.InputPath)
	if not placeData then
		error("Failed to read place file '" .. CONFIG.InputPath .. "': " .. tostring(readErr))
		return false
	end

	success, game = protectedCall(roblox.deserializePlace, "Failed to deserialize place file", placeData)
	if not success then return false end
	log("Place file deserialized successfully.")

	-- 3. Traversing the manifest and exporting models
	log("Starting instance export based on manifest...")
	for _, serviceData in ipairs(manifest) do
		local serviceName = serviceData.name
		if not serviceName then
			warn("Invalid service entry in manifest: missing 'name'. Skipping.")
			continue
		end

		log("Processing service: " .. serviceName, 1)
		local getServiceSuccess, service = protectedCall(game.GetService, "Failed to get service: " .. serviceName, game,
			serviceName)

		if getServiceSuccess and serviceData.children then
			for _, childNode in ipairs(serviceData.children) do
				processNode(childNode, service, 2)
			end
		end
	end

	return #criticalErrors == 0
end

--------------------------------------------------------------------------------
-- Script Execution and Final Report
--------------------------------------------------------------------------------
print("--- Starting Extraction ---")
local extractionSuccessful = protectedCall(main, "Main extraction function failed unexpectedly")

print("\n--- Extraction Summary ---")
if #missingInstances > 0 then
	print("The following instances were NOT found in the place file (and were not exported):")
	for _, path in ipairs(missingInstances) do
		print("  - " .. path)
	end
else
	print("All instances from the manifest were found in the place file.")
end

if #criticalErrors > 0 then
	print("\nCritical errors occurred during extraction:")
	for i, err in ipairs(criticalErrors) do
		print(string.format("  %d. %s", i, err))
	end
end

if extractionSuccessful and #criticalErrors == 0 then
	if #missingInstances > 0 then
		print("\nExtraction completed with warnings (some instances were missing).")
	else
		print("\nExtraction completed successfully!")
	end
else
	print("\nExtraction failed due to critical errors.")
end
print("--- End of Extraction Summary ---")
