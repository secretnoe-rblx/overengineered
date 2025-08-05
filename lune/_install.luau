local fs = require("@lune/fs")
local roblox = require("@lune/roblox")
local serde = require("@lune/serde")
local process = require("@lune/process")

-- Check if running on Windows
if process.os ~= "windows" then
    print("SDK installation is not supported on " .. process.os .. " systems, install it yourself")
    return nil
end

-- Define source and destination paths
local sourcePath = "./game/SDK.rbxmx"
local pluginPath = roblox.studioPluginPath()
local destinationPath = pluginPath .. "/SDK.rbxmx"

-- Check if source file exists
if not fs.isFile(sourcePath) then
    print("Error: Source file not found at " .. sourcePath)
    return nil
end

-- Check if SDK is already installed
local isAlreadyInstalled = fs.isFile(destinationPath)

-- Check if plugin directory exists, create if it doesn't
if not fs.isDir(pluginPath) then
    if not isAlreadyInstalled then
        print("Creating plugin directory at " .. pluginPath)
    end
    fs.writeDir(pluginPath)
end

-- Copy the SDK file
if not isAlreadyInstalled then
    print("Copying SDK.rbxmx to Roblox Studio plugins...")
    print("Source: " .. sourcePath)
    print("Destination: " .. destinationPath)
end

local sourceContent = fs.readFile(sourcePath)
fs.writeFile(destinationPath, sourceContent)

if not isAlreadyInstalled then
    print("SDK.rbxmx successfully installed to Roblox Studio plugins!")
end
return nil
