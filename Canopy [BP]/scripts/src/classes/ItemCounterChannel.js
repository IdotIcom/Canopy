import { system, world } from "@minecraft/server";
import Utils from "../../include/utils";

class ItemCounterChannel {
    constructor(color, dpIdentifier) {
        if (this.constructor === ItemCounterChannel)
            throw new Error("Cannot instantiate abstract class 'ItemCounterChannel'");
        this.color = color;
        this.dpIdentifier = dpIdentifier;
        this.hopperList = new Array();
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        this.mode = 'count';
        world.setDynamicProperty(this.dpIdentifier, JSON.stringify(this));
    }

    getData() {
        const channelJSON = world.getDynamicProperty(this.dpIdentifier);
        if (!channelJSON) 
            throw new Error(`No channel found for color ${this.color}`);
        return JSON.parse(channelJSON);
    }

    setData(channelData) {
        world.setDynamicProperty(this.dpIdentifier, JSON.stringify(channelData));
    }

    reset() {
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        world.setDynamicProperty(this.dpIdentifier, JSON.stringify(this));
    }

    addHopper(hopper) {
        if (this.hopperList.length === 0)
            this.reset();
        if (this.includes(hopper))
            throw new Error(`Hopper already exists in channel ${this.color}`);
        this.hopperList.push({ 
            location: hopper.location, 
            dimensionId: hopper.dimension.id,
            outputItemType: null
        });
        this.#updateData();
        return true;
    }

    includes(hopper) {
        const channel = this.getData();
        return channel.hopperList.find(knownHopper => 
            knownHopper.location.x === hopper.location.x
            && knownHopper.location.y === hopper.location.y
            && knownHopper.location.z === hopper.location.z
            && knownHopper.dimensionId === hopper.dimension.id
        );
    }

    removeHopper(hopper) {
        this.hopperList = this.hopperList.filter(knownHopper => 
            knownHopper.location.x !== hopper.location.x ||
            knownHopper.location.y !== hopper.location.y ||
            knownHopper.location.z !== hopper.location.z ||
            knownHopper.dimensionId !== hopper.dimension.id
        );
        system.runTimeout(() => {
            if (this.hopperList.length === 0)
                this.reset();
            else
                this.#updateData();
        }, 0);
    }

    isEmpty() {
        return this.hopperList.length === 0;
    }

    getQueryOutput(translatableQueryHeaderStr, useRealTime = false) {
        const realtimeText = useRealTime ? 'realtime: ' : '';
        const message = { rawtext: [
            { translate: translatableQueryHeaderStr, with: [
                Utils.formatColorStr(this.color),
                realtimeText, 
                String(this.#getMinutesSinceStart(this)), 
                String(this.totalCount), 
                this.#calculatePerTime(this.totalCount, this.#getDeltaTime())
            ]}
        ]};
        for (const item of Object.keys(this.itemMap))
            message.rawtext.push({ text: `\n §7- ${item}: ${this.#getAllModeOutput(item)}` });
        return message;
    }

    onTick(getItemCountsCallback) {
        if (this.isEmpty())
            return;
        this.#removeDestroyed();
        this.#updateCount(getItemCountsCallback());
    }

    getAttachedBlockFromHopper() {
        throw new Error("Method 'getValidBlockFromHopper' must be implemented");
    }

    getModedTotalCount() {
        return this.#calculatePerTime(this.totalCount, this.#getDeltaTime(), this.mode);
    }

    #calculatePerTime(totalCount, deltaTicks, mode = 'count') {
		const ticksPerHour = 72000;
		let itemsPerHour = totalCount / (deltaTicks / ticksPerHour);
		let unit = 'h';
		if (mode === 'min') {
			itemsPerHour /= 60;
			unit = 'm';
		}
		if (mode === 'sec') {
			itemsPerHour /= 3600;
			unit = 's';
		}
		if (isNaN(itemsPerHour) || itemsPerHour === Infinity)
            return '?/?';
		return `${itemsPerHour.toFixed(1)}/${unit}`;
	}

    #getDeltaTime(useRealTime) {
        const millisecondsPerTick = 50.0;
        let deltaTicks;
        if (useRealTime)
            deltaTicks = (Date.now() - this.startRealTime) / millisecondsPerTick;
        else
            deltaTicks = system.currentTick - this.startTickTime;
        deltaTicks = Math.floor(deltaTicks / 8) * 8; // normalize to hopper speed
        return deltaTicks;
    }
    
    #updateCount(itemStacks) {
        for (const itemStack of itemStacks) {
            const itemName = itemStack.typeId.replace('minecraft:', '');
            this.itemMap[itemName] = (this.itemMap[itemName] || 0) + itemStack.amount;
            this.totalCount += itemStack.amount;
        }
        this.#updateData();
    }

    #removeDestroyed() {
        for (const knownHopper of this.hopperList) {
            const hopperBlock = world.getDimension(knownHopper.dimensionId).getBlock(knownHopper.location);
            if (!hopperBlock) continue;
            if (hopperBlock.typeId !== 'minecraft:hopper' || this.getAttachedBlockFromHopper(hopperBlock)?.typeId !== `minecraft:${this.color}_wool`)
                this.removeHopper(hopperBlock);
        }
    }

    #getAllModeOutput(item) {
        let output = '';
    
        output += `${Utils.getColorCode(this.color)}${this.itemMap[item]}`;
        for (let i = 0; i < RATE_MODES.length; i++) {
            if (i === 0) output += ' §7(';
            else output += '§7, ';
            output += `${this.#calculatePerTime(this.itemMap[item], this.#getDeltaTime(), RATE_MODES[i])}`;
        }
        output += '§7)';
        return output;
    }

    #getMinutesSinceStart() {
        const minutes = this.#getDeltaTime() / 1200;
        return minutes.toFixed(2);
    }

    #updateData() {
        world.setDynamicProperty(this.dpIdentifier, JSON.stringify(this));
    }
}

export default ItemCounterChannel;