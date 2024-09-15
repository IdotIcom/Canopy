// quickFillContainer - when right clicking on a container with an item in hand, deposit all of that item into the container
import { system, world } from "@minecraft/server";
import { Rule } from "lib/canopy/Canopy";

new Rule({
    category: 'Rules',
    identifier: 'quickFillContainer',
    description: 'Using an item on a container while an arrow in the top left slot of your inventory will deposit all of that item into the container.'
});

const ARROW_SLOT = 9;

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (!Rule.getValue('quickFillContainer')) return;
    const block = event.block;
    const blockInv = block.getComponent('inventory')?.container;
    if (!blockInv) return;
    const player = event.player;
    if (!player) return;
    const playerInv = player.getComponent('inventory')?.container;
    if (!playerInv || playerInv.getItem(ARROW_SLOT)?.typeId !== 'minecraft:arrow') return;
    const handItemStack = event.itemStack;
    if (!handItemStack) return;
    event.cancel = true;

    system.run(() => {
        const successfulTransfers = transferAllItemType(playerInv, blockInv, handItemStack.typeId);
        const feedback = `§7Filled ${block.typeId.replace('minecraft:', '')} with all ${handItemStack.typeId.replace('minecraft:', '')} (§a${successfulTransfers}§7/§a${blockInv.emptySlotsCount}§7)`
        player.onScreenDisplay.setActionBar(feedback);
    });
});

function transferAllItemType(fromContainer, toContainer, itemTypeId) {
    let successfulTransfers = 0;
    for (let slotIndex = 0; slotIndex < fromContainer.size; slotIndex++) {
        const currFromItem = fromContainer.getItem(slotIndex);
        if (currFromItem?.typeId === itemTypeId) {
            const untransferred = toContainer.addItem(currFromItem);
            if (untransferred) {
                fromContainer.setItem(slotIndex, untransferred);
            } else {
                fromContainer.setItem(slotIndex, null);
                successfulTransfers++;
            }
        }
    }
    return successfulTransfers;
}
