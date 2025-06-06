import { describe, it, expect, vi, beforeEach } from "vitest";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rules.js";
import { Rule } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rule.js";

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
            }
        }
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    }
}));

describe('Rules', () => {
    let testRule;
    beforeEach(() => {
        Rules.clear();
        testRule = new Rule({ 
            category: 'test', 
            identifier: 'test_rule',
            description: 'This is a test rule',
            extensionName: 'Test Extension',
            contingentRules: ['test_rule_2'],
            independentRules: ['test_rule_3']
        });
    });

    describe('register', () => {
        it('should add a new rule if it does not exist', async () => {
            const ruleMock = {
                identifier: 'test_rule_2',
                getID: () => 'test_rule_2',
                getCategory: () => 'test',
                getValue: () => false
            }
            await Rules.register(ruleMock);
            expect(Rules.get('test_rule_2')).toBe(ruleMock);
        });

        it('should not add a rule if the rule already exists', async () => {
            const ruleMock = {
                identifier : 'test_rule',
                getID: () => 'test_rule',
                getCategory: () => 'test',
                getValue: () => false
            }
            await expect(async () => await Rules.register(ruleMock)).rejects.toThrow();
        });
    });

    describe('get', () => {
        it('should return the rule if it exists', () => {
            expect(Rules.get('test_rule')).toBeInstanceOf(Rule);
            expect(Rules.get('test_rule')).toBe(testRule);
        });

        it('should return undefined if the rule does not exist', () => {
            expect(Rules.get('non_existent_rule')).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('should return all rules', () => {
            const rule2 = new Rule({
                category: 'test',
                identifier: 'test_rule_2',
                description: 'This is a test rule 2',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_1'],
                independentRules: ['test_rule_3']
            });

            const allRules = Rules.getAll();
            expect(allRules.length).toBe(2);
            expect(allRules).toContain(Rules.get('test_rule'));
            expect(allRules).toContain(rule2);
        });

        it('should return an empty array if no rules exist', () => {
            Rules.clear();
            expect(Rules.getAll()).toEqual([]);
        });
    });

    describe('getIDs', () => {
        it('should return all rule IDs', () => {
            new Rule({
                category: 'test',
                identifier: 'test_rule_2',
                description: 'This is a test rule 2',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_1'],
                independentRules: ['test_rule_3']
            });

            const ruleIDs = Rules.getIDs();
            expect(ruleIDs.length).toBe(2);
            expect(ruleIDs).toContain('test_rule');
            expect(ruleIDs).toContain('test_rule_2');
        });
    });

    describe('exists', () => {
        it('should return true if the rule exists', () => {
            expect(Rules.exists('test_rule')).toBe(true);
        });

        it('should return false if the rule does not exist', () => {
            expect(Rules.exists('non_existent_rule')).toBe(false);
        });
    });

    describe('remove', () => {
        it('should remove the rule if it exists', () => {
            Rules.remove('test_rule');
            expect(Rules.get('test_rule')).toBeUndefined();
            expect(Rules.exists('test_rule')).toBe(false);
        });

        it('should do nothing if the rule does not exist', () => {
            Rules.remove('non_existent_rule');
            expect(Rules.get('non_existent_rule')).toBeUndefined();
            expect(Rules.exists('non_existent_rule')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all rules', () => {
            new Rule({
                category: 'test',
                identifier: 'test_rule_1',
                description: 'This is a test rule 1',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_2'],
                independentRules: ['test_rule_3']
            });
            expect(Rules.getAll().length).toBe(2);
            Rules.clear();
            expect(Rules.getAll().length).toBe(0);
            expect(Rules.get('test_rule_1')).toBeUndefined();
            expect(Rules.get('test_rule_2')).toBeUndefined();
        });
    });

    describe('getValue', () => {
        it('should return the value of the rule if it exists', async () => {
            const mockValue = true;
            vi.spyOn(testRule, 'getValue').mockResolvedValue(mockValue);

            const value = await Rules.getValue('test_rule');
            expect(value).toBe(mockValue);
        });

        it('should throw an error if the rule does not exist', async () => {
            await expect(Rules.getValue('non_existent_rule')).rejects.toThrow();
        });
    });

    describe('getNativeValue', () => {
        it('should return the native value of the rule if it exists', () => {
            const mockValue = true;
            vi.spyOn(testRule, 'getNativeValue').mockReturnValue(mockValue);

            const value = Rules.getNativeValue('test_rule');
            expect(value).toBe(mockValue);
        });

        it('should throw an error if the rule does not exist', () => {
            expect(() => Rules.getNativeValue('non_existent_rule')).toThrow();
        });
    });

    describe('setValue', () => {
        it('should set the value of the rule if it exists', () => {
            const mockValue = true;
            vi.spyOn(testRule, 'setValue').mockImplementation((value) => {
                testRule.value = value;
            });

            Rules.setValue('test_rule', mockValue);
            expect(testRule.value).toBe(mockValue);
        });

        it('should throw an error if the rule does not exist', () => {
            expect(() => Rules.setValue('non_existent_rule', true)).toThrow();
        });
    });
    
    describe('getDependentRuleIDs', () => {
        it('should return an array of dependent rule IDs if they exist', () => {
            new Rule({
                category: 'test',
                identifier: 'test_rule_1',
                description: 'This is a test rule 1',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_2'],
                independentRules: ['test_rule_3']
            });
            new Rule({
                category: 'test',
                identifier: 'test_rule_2',
                description: 'This is a test rule 2',
                extensionName: 'Test Extension',
                contingentRules: [],
                independentRules: ['test_rule_3']
            });

            const dependentRuleIDs = Rules.getDependentRuleIDs('test_rule_2');
            expect(dependentRuleIDs).toEqual(['test_rule','test_rule_1']);
        });

        it('should return an empty array if no dependent rules exist', () => {
            new Rule({
                category: 'test',
                identifier: 'test_rule_1',
                description: 'This is a test rule 1',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_2'],
                independentRules: ['test_rule_3']
            });

            const dependentRuleIDs = Rules.getDependentRuleIDs('test_rule');
            expect(dependentRuleIDs).toEqual([]);
        });

        it('should throw an error if the rule does not exist', () => {
            expect(() => Rules.getDependentRuleIDs('non_existent_rule')).toThrow();
        });
    });

    describe('getByCategory', () => {
        it('should return all rules of a specific category', () => {
            new Rule({
                category: 'test',
                identifier: 'test_rule_1',
                description: 'This is a test rule 1',
                extensionName: 'Test Extension',
                contingentRules: ['test_rule_2'],
                independentRules: ['test_rule_3']
            });
            new Rule({
                category: 'test',
                identifier: 'test_rule_2',
                description: 'This is a test rule 2',
                extensionName: 'Test Extension',
                contingentRules: [],
                independentRules: ['test_rule_3']
            });

            const testRules = Rules.getByCategory('test');
            expect(testRules.length).toBe(3);
            expect(testRules).toContain(Rules.get('test_rule'));
            expect(testRules).toContain(Rules.get('test_rule_1'));
            expect(testRules).toContain(Rules.get('test_rule_2'));
        });

        it('should return an empty array if no rules of that category exist', () => {
            new Rule({
                category: 'other',
                identifier: 'other_rule_1',
                description: 'This is a test rule 1',
                extensionName: 'Test Extension',
                contingentRules: ['other_rule_2'],
                independentRules: ['other_rule_3']
            });

            const testRules = Rules.getByCategory('unusedCategory');
            expect(testRules.length).toBe(0);
        });
    });
});
