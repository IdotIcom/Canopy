import { Command, InfoDisplayRule } from 'lib/canopy/Canopy';
import ProbeManager from 'src/classes/ProbeManager';

const cmd = new Command({
    name: 'info',
    description: { translate: 'commands.info' },
    usage: 'info <rule/all> <true/false>',
    args: [
        { type: 'string', name: 'ruleID' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand
});

new Command({
    name: 'i',
    description: { translate: 'commands.info' },
    usage: 'i',
    args: [
        { type: 'string', name: 'ruleID' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand,
    helpHidden: true
});

function infoCommand(sender, args) {
    const { ruleID, enable } = args;
    if (ruleID === null && enable === null) return cmd.sendUsage(sender);
    
    if (ruleID === 'all') {
        changeAll(sender, enable);
        return;
    }
    
    if (!InfoDisplayRule.exists(ruleID))
        return sender.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Command.prefix] });
    const ruleValue = InfoDisplayRule.getValue(sender, ruleID);
    if (enable === null) {
        const enabledRawText = ruleValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        return sender.sendMessage({ translate: 'rules.generic.status', with: [ruleID, enabledRawText] });
    }
    if (enable === ruleValue) {
        const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        return sender.sendMessage({ tramslate: 'rules.generic.nochange', with: [ruleID, enabledRawText] });
    }

    if (['showDisplay', 'light', 'biome'].includes(ruleID))
        ProbeManager.removeProbe(sender);
    if (ruleID === 'showDisplay' && !enable)
        clearInfoDisplay(sender);
    
    const rule = InfoDisplayRule.getRule(ruleID);
    if (!enable)
        updateRules(sender, rule.getDependentRuleIDs(), enable);
    else
        updateRules(sender, rule.getContigentRuleIDs(), enable);
    updateRules(sender, rule.getIndependentRuleIDs(), !enable);

    updateRule(sender, ruleID, ruleValue, enable);
}

function changeAll(sender, enable) {
    for (let entry of InfoDisplayRule.getRules()) {
        entry.setValue(sender, enable);
    }
    if (!enable) clearInfoDisplay(sender);
    sender.sendMessage({ translate: 'commands.info.allupdated', with: [enable ? '§l§aEnabled' : '§l§cDisabled'] });
}

function clearInfoDisplay(sender) {
    sender.onScreenDisplay.setTitle('');
}

function updateRule(sender, ruleID, ruleValue, enable) {
    if (ruleValue === enable) return;
    InfoDisplayRule.setValue(sender, ruleID, enable);
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    sender.sendMessage({ translate: 'rules.generic.updated', with: [ruleID, enabledRawText] });
}

function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) {
        updateRule(sender, ruleID, InfoDisplayRule.getValue(sender, ruleID), enable);
    }
}
