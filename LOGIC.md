I am building a sandbox building game. I will need your help figuring out on how exactly to do a part of it.
Right now I need to code a system of block logic - basically blocks that do something.

First, I'll present a set of basic requirements for this:
- Blocks have inputs and outputs (we call them markers)
- Any output can be connected to any input of the same type. No other connection type is possible (no output-output or input-input connections)
- Every marker has a type, and possibly more than one
- Blocks have their logic run in an outside-controlled ticking class once per frame, preferrably without unnesessary ticking (no block ticking if its inputs are unchanged, unless specifically stated)
- Required support for circular connections (via waiting for the next tick every loop)
- Tick every block no more than once per tick
- Tick blocks only after every (needed) input value was received
- (Preferrably) Support for hot connecting & disconecting between markers

Now I'll try to explain some problems I've been met with while trying to figure out a way to build this system.

First, performance of ticking every block every frame.
For example, I have an addition block. It has 2 inputs and 1 output, and any time any input gets changed, the output value is set to the sum of the inputs.
There's no need to tick it if the inputs are not changed.
(Is there even a need to "tick" it at all, or do we treat it as more of an "operation" with a calculate() method to calculate the values? But that will only work with a pull ticking system (explained later), if I'm not wrong.)
But how do we know if the inputs are changed if they're connected through multiple blocks?

Second, running blocks only once.
For example, that addition block. If both its inputs get changed in the same tick, the block would calculate the result twice - which we need to avoid at all cost. How?

Block types:
The addition block does nothing on it's own. This I'll call an operator block. It's only useful if you connect it into something that actually does something - which I'll call an actor block.
Actors are blocks like a screen, which shows its input, or a thruster, which uses the strength input to fly. Those blocks need to be ticked every frame and they get their values from operators or other actors.
Keyboard sensor is a sensor block. It's what actually gets the initial values for passing further. Though actors also can output values??? Which one is which and where...

Right now I'm considering two different possible options of designing the system - push and pull options. (Feel free to suggest any other system if you think it will help.)
But both system have problems:

Push:
Push makes sense to do as I also have a lot of reactive blocks - like a keyboard sensor, I have no idea how to write this block in a pull system without recalculating every block every tick. (If you have any suggestions on that front, please send.)
But, push system suffers from the multi-calculation problem I've mentioned before. For example:

I have 3 blocks. It doesn't matter which blocks those are, the only thing that matters are their connections.
Block 1 outputs its value to the blocks 2 and 3, block 2 outputs its value to the block 3.
If we use a push mechanism, when block 1 gets calculated it will send its value to both 2 and 3, BUT the block 3 should not be calculated yet as it hasn't yet received its value from block 2.
How do we know that in code? How do we prevent that? I don't know.
Well, I have a single solution - calculating the order of every block before starting. Which is, 1) really hard, considering the possibility of circular connections and just general calculation problems, and 2) its support for hot connecting and disconnecting will not be good.

Pull:
Completely gets rid of the multi-calculation problem, but suffers from worse performance, since now every tick the actors would constantly recalculate their input blocks, since they can't know if they were changed. Or can they????
Keyboard sensor for example. Now it needs to somehow signal to the actors to trigger their tick, or to the operators to update themselves... but then it's just becoming a push system????

I want you to give me a very detailed analysis on everything related to this.
