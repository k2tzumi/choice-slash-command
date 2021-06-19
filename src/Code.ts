import { Slack } from "./slack/types/index.d";
import { SlackHandler } from "./SlackHandler";
import { SlashCommandFunctionResponse } from "./SlashCommandHandler";
import { DuplicateEventError } from "./CallbackEventHandler";
import { JobBroker } from "apps-script-jobqueue";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type DoPost = GoogleAppsScript.Events.DoPost;
type Commands = Slack.SlashCommand.Commands;

const asyncLogging = (): void => {
  JobBroker.enqueueAsyncJob((parameter: Record<string, any>) => {
    console.info(JSON.stringify(parameter));
  });
};

const properties = PropertiesService.getScriptProperties();
const VERIFICATION_TOKEN: string = properties.getProperty("VERIFICATION_TOKEN");
const COMMAND = "/choice";

function doPost(e: DoPost): TextOutput {
  const slackHandler = new SlackHandler(VERIFICATION_TOKEN);

  slackHandler.addCommandListener(COMMAND, executeSlashCommand);

  try {
    const process = slackHandler.handle(e);

    if (process.performed) {
      JobBroker.
      
      JobBroker.enqueueAsyncJob(asyncLogging, {
        message: "peformed!"
      });
      return process.output;
    }
  } catch (exception) {
    if (exception instanceof DuplicateEventError) {
      return ContentService.createTextOutput();
    } else {
      JobBroker.enqueueAsyncJob(asyncLogging, {
        message: exception.message,
        stack: exception.stack
      });
      throw exception;
    }
  }

  throw new Error(`No performed handler, request: ${JSON.stringify(e)}`);
}

const executeSlashCommand = (
  commands: Commands
): SlashCommandFunctionResponse | null => {
  const choiceWords = commands.text.split(" ");
  if (choiceWords.length === 1) {
    return createUsageResponse();
  }

  if (
    commands.user_id.replace(/[^0-9]/g, "").slice(-1) ===
    commands.trigger_id.slice(-1)
  ) {
    return createSabotageResponse();
  } else {
    return createChoiceResponse(randomChoice(choiceWords));
  }
};

function randomChoice(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

function createUsageResponse(): SlashCommandFunctionResponse {
  return {
    response_type: "ephemeral",
    text: `*Usage*\n* ${COMMAND} keyword1 keyword2 keyword3\n* ${COMMAND} help`
  };
}

function createChoiceResponse(word: string): SlashCommandFunctionResponse {
  return {
    response_type: "in_channel",
    text: `I picked out the \`${word}\` for you.`
  };
}

function createSabotageResponse(): SlashCommandFunctionResponse {
  return {
    response_type: "in_channel",
    text: "I'm not in the mood for that."
  };
}

export { executeSlashCommand };
