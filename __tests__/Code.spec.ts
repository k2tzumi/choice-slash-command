import { Slack } from "../src/slack/types/index.d";
type Commands = Slack.SlashCommand.Commands;

const properites = {
    getProperty: jest.fn(function () {
        return 'dummy';
    }),
    deleteAllProperties: jest.fn(),
    deleteProperty: jest.fn(),
    getKeys: jest.fn(),
    getProperties: jest.fn(),
    setProperties: jest.fn(),
    setProperty: jest.fn()
};

PropertiesService['getScriptProperties'] = jest.fn(() => properites)
PropertiesService['getUserProperties'] = jest.fn(() => properites)

import { executeSlashCommand } from "../src/Code";
describe('Code', () => {
    describe('executeSlashCommand', () => {
        it('/', () => {
            const commands: Commands = {} as Commands;

            commands.text = '';
            commands.user_id = 'U2147483697';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'ephemeral');
            expect(actual).toHaveProperty('text');
        });
        it('choice', () => {
            const commands: Commands = {} as Commands;

            commands.text = 'word1 word2 word3';
            commands.user_id = 'U2147483697';
            commands.trigger_id = '13345224609.738474920.8088930838d88f008e0';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'in_channel');
            expect(actual.text).toMatch(/^I picked out the /);
        });
        it('Sabotage', () => {
            const commands: Commands = {} as Commands;

            commands.text = 'word1 word2 word3';
            commands.user_id = 'U2147483697';
            commands.trigger_id = '13345224609.738474920.8088930838d88f008e7';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'in_channel');
            expect(actual).toHaveProperty('text', "I'm not in the mood for that.");
        });
        it('help', () => {
            const commands: Commands = {} as Commands;

            commands.text = 'help';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'ephemeral');
            expect(actual).toHaveProperty('text');
        });
    });
});
