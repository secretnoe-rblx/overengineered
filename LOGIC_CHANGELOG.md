# hie engineers
logicv3 update alpha test number one incoming
**working not guaranteed** so maybe i'll just un-release this after 5 seconds of this being a disaster

# changelog probably not full because i forgor

## Fixing the logic
Logic should now always work correctly (it didn't. like, at all).
If you seen errors like "attempt to add string and number" or unexpectedly exploding tnt blocks, now they shouldn't happen.
The blocks will no longer be in a half-working state just because it didn't like your wire order.
Circular wire connections will result in fire now, though. Some of them. Sometimes. Just use an impulse generator or something idk


## Config tool
UI of the config tool was updated to be more cool and easier to work with. ||The colors are shit though. Maks, please fix||

- Improved handling for multi-type logic values
Did you notice that you could connect a multi-typed logic marker to a single-type in the wire tool, and then still be able to change its type in the config tool? Well good if you didn't and anyways that's now fixed.
- New cool and useless colors indicating the type!!!!!wow
- The configuration values will now be property ordered. ||Most of them, at least||
No more of that stupid "YZX" in vector blocks or "+" after "-" in the rocket engine.


## Other
- Added ordering of logic markers to the wire tool
No more of that stupid [Y Z X] in vector blocks

- Improved reliability & latency of the rocket engine autoconfigured controls
- Added description tooltips to some configuration values (in the config tool), explaining something. Also measurement units. Sometimes.


## Controls
- The new controls stuff is cool, you can configure shit better
- Also you can now disable the controls for the controllable blocks if you want just a constant value for some reason
- Added the Controller block which outputs something based on your input (basically like having a motor but instead of a motor you have a logic number output)


## Fixes
- Byte maker or byte splitter idk which one of them or both, I've fixed the bit ordering. For example, now the "1" output/input represents the actual lowest bit (0 in 0b10) and not whatever maks felt like doing.


## Additions
- Delay block has the new mode of operation - you can configure whether the delay runs in ticks or seconds
- Memory block is renamed to be a legacy memory and will be inaccessible through the block selection UI. (you can still middle-click/pipette copy it but why).
	The new memory block is the same but has an additional input for the default value - the value that this block will return immediately on start.
	Maybe I'll bring back the legacy memory under a different name, idk if anyone needs it.
- Added a basic logic (values and internal data) visualizer (button in the actionbar in ride mode, you won't miss it)


## Important
- Unconnected unset block config values now result in death and destruction and fire and screams and horror so don't do that
- Partially unconfigured blocks (mostly add, subtract, multiply, divide, but probably some others) might not correctly guess the type of a parameter and will be set to unset, you'll need to configure them correctly before usage. (Will be fixed before the actual release hopefully)
- Circular connections without any initial value inside will now just hang forever or catch on fire.


## regarding saving
Saves use the new v25 version. That means:
- You should not save over your existing saves until at least the full release unless (unless you want to protentially lose them?)
- You should not load test saves in prod. I mean you can but it wouldn't work anyways and may cause problems with loading if you save those in prod again for some reason.
Including "Last \*\*\*\*" yes
- Any save after loading should have all the configuration/wires transferred (except what is specified in ##important section). If you see something that has no value where it should or a disconnected wire or something, ping me
