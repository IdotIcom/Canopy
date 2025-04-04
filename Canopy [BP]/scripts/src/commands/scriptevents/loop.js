import { system, world, MinecraftDimensionTypes, Block } from "@minecraft/server";
import { getScriptEventSourceObject, isNumeric } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "canopy:loop") return;
    const message = event.message;
    const args = message.match(/(\d+)\s+"([^"]+)"/)?.slice(1);
    if (!args) return;
    
    const source = getScriptEventSourceObject(event);
    let runLocation = source;
    if (source === 'Server')
        runLocation = world.getDimension(MinecraftDimensionTypes.overworld);
    else if (source === 'Unknown')
        return 'Unknown source. Try running the command from somewhere else.';
    else if (typeof source === Block)
        runLocation = source.dimension;
    loopCommand(args[0], args[1], runLocation);
});

function loopCommand(times, command, runLocation) {
    if (!isNumeric(times))
        return 'Invalid arguments. Usage: loop <times> <command>';

    for (let i = 0; i < times; i++) 
        runLocation.runCommand(command);
    
}
