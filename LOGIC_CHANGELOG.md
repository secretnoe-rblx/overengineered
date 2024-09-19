# hie engineers
logicv3 update alpha test number one incoming

# changelog probably not full because i forgor

## Fixing the logic
Logic should now always work correctly (it didn't).
If you seen errors like "attempt to add string and number" or unexpectedly exploding tnt blocks, now they shouldn't happen.
The blocks will no longer be in a half-working state just because it didn't like your wire order.
- Circular wire connections will result in fire now, though. Some of them. Sometimes. Just use an impulse generator or something idk
- Unconnected unset block config values now result in death and destruction and fire and screams and horror so don't do that


## Config tool
UI of the config tool was updated to be more cool and easier to work with. ||The colors are shit though. Maks, please fix||
- Improved handling for multi-type logic values
Did you notice that you could connect a multi-typed logic marker to a single-type in the wire tool, and then still be able to change its type in the config tool? Well good if you didn't and that's now fixed anyways.
- New cool and useless colors indicating the type!!!!!wow
- The configuration values will now be property ordered. ||Most of them, at least||
No more of that stupid "YZX" in vector blocks or "+" after "-" in the rocket engine.


## Controls
- The new controls stuff is cool, you can configure blocks better, like making a smooth steering car without any logic wires
- Also you can now disable the controls for the controllable blocks if you want just a constant value for some reason
- Added the Controller block which outputs something based on your input (basically like having a motor but instead of a motor you have a logic number output)


## New blocks
- Added a Fire Sensor block – returns true when a fire is detected
- Added Vector3 Normalize block – returns the normalized version of the input vector
- Added Vector3 Magnitute block – returns the length of the input vector


## Block logic changes
- Added a new mode of operation for the Delay block - configures whether the delay runs in ticks or seconds
- Added new modes of operation for the Single Impulse block – "rise trigger", "fall trigger", "both". Also renamed it to edging detector
- Added a second delay value to the Impulse Generator block – now you can configure different amounts of time it spends in high or low
- Added "default value" input to the Memory block - the value that this block will output immediately on start.
- Added "force" configuration to suspension – the force of something idk
- Added "precision" configuration to the Round block – the precision to which round to (like 3.2 rounding to 4 when the precision is 2)


## Additions
- Added a basic logic (values + internal data) visualizer (button at the top in the ride mode)
- Added description tooltips to block configuration values, explaining them. Also measurement units. Sometimes. Hover over an option in the config tool (or hold your finger there, if on mobile) for the tooltip to appear
- Added a new plane tutorial


## Changes
- Added ordering of logic markers to the wire tool – no more of that stupid [Y Z X] in vector blocks
- Limited the maximum amount of some blocks
- Improved reliability & latency of the autoconfigured block controls
- Reduced fire from TNTs by 20%
- Updated the visuals of the hotbar for some reason
- Made ragdoll key to pass-through its input – now if you have a block configured to the same key as the ragdoll, they will both activate


## Fixes
- Fixed the bit ordering of byte maker or byte splitter idk which one of them or both. For example, now the "1" output/input represents the actual lowest bit (0 in 0b10) and not whatever maks felt like doing.
- Fixed radar exploding TNTs
- Fixed mirroring of some blocks
- Fixed offset of all cylinders
- Fixed teleport to plot when player is sitting on other's seats


## regarding testing
In the test place you can load any of your main place saves, but not the other way.
Scroll down in the saves UI to see them.
