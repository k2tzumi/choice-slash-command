import { Slack } from "./slack/types/index.d";
import { SlackHandler } from "./SlackHandler";
import { SlashCommandFunctionResponse } from "./SlashCommandHandler";
import { DuplicateEventError } from "./CallbackEventHandler";
import { OAuth2Handler } from "./OAuth2Handler";
import { SlackApiClient } from "./SlackApiClient";
import * as JobBroker from "apps-script-jobqueue";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type HtmlOutput = GoogleAppsScript.HTML.HtmlOutput;
type DoPost = GoogleAppsScript.Events.DoPost;
type DoGet = GoogleAppsScript.Events.DoGet;
type Commands = Slack.SlashCommand.Commands;

const asyncLogging = (): void => {
  JobBroker.consumeAsyncJob((parameter: Record<string, any>) => {
    console.info(JSON.stringify(parameter));
  }, "asyncLogging");
};

const properties = PropertiesService.getScriptProperties();
const VERIFICATION_TOKEN: string = properties.getProperty("VERIFICATION_TOKEN");
const CLIENT_ID: string = properties.getProperty("CLIENT_ID");
const CLIENT_SECRET: string = properties.getProperty("CLIENT_SECRET");
let handler: OAuth2Handler;
const COMMAND = "/choice";

const handleCallback = (request): HtmlOutput => {
  initializeOAuth2Handler();
  return handler.authCallback(request);
};

function initializeOAuth2Handler(): void {
  handler = new OAuth2Handler(
    CLIENT_ID,
    CLIENT_SECRET,
    PropertiesService.getUserProperties(),
    handleCallback.name
  );
}

/**
 * Authorizes and makes a request to the Slack API.
 */
function doGet(request: DoGet): HtmlOutput {
  initializeOAuth2Handler();

  // Clear authentication by accessing with the get parameter `?logout=true`
  if (request.parameter.hasOwnProperty("logout")) {
    handler.clearService();
    const template = HtmlService.createTemplate(
      'Logout<br /><a href="<?= requestUrl ?>" target="_blank">refresh</a>.'
    );
    template.requestUrl = handler.requestURL;
    return HtmlService.createHtmlOutput(template.evaluate());
  }

  if (handler.verifyAccessToken()) {
    return HtmlService.createHtmlOutput("OK");
  } else {
    const template = HtmlService.createTemplate(
      'RedirectUri:<?= redirectUrl ?> <br /><a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>.'
    );
    template.authorizationUrl = handler.authorizationUrl;
    template.redirectUrl = handler.redirectUri;
    return HtmlService.createHtmlOutput(template.evaluate());
  }
}

function doPost(e: DoPost): TextOutput {
  initializeOAuth2Handler();

  const slackHandler = new SlackHandler(VERIFICATION_TOKEN);

  slackHandler.addCommandListener(COMMAND, executeSlashCommand);

  try {
    const process = slackHandler.handle(e);

    if (process.performed) {
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
  const locale = getLocale(commands.channel_id);
  const choiceWords = commands.text.split(" ");
  if (choiceWords.length === 1) {
    return createUsageResponse(locale);
  }

  if (
    commands.user_id.replace(/[^0-9]/g, "").slice(-1) ===
    commands.trigger_id.slice(-1)
  ) {
    return createSabotageResponse(locale);
  } else {
    return createChoiceResponse(randomChoice(choiceWords), locale);
  }
};

function getLocale(channel_id: string): string {
  const client = new SlackApiClient(handler.token);
  const conversations = client.conversationsInfo(channel_id);

  return conversations.locale;
}

function randomChoice(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

function createUsageResponse(locale: string): SlashCommandFunctionResponse {
  switch (locale) {
    case "ja-JP":
      return {
        response_type: "ephemeral",
        text: `*使い方*\n* ${COMMAND} 梅 竹 松\n* ${COMMAND} help`
      };
    case "en-US":
    default:
      return {
        response_type: "ephemeral",
        text: `*Usage*\n* ${COMMAND} keyword1 keyword2 keyword3\n* ${COMMAND} help`
      };
  }
}

function createChoiceResponse(
  word: string,
  locale: string
): SlashCommandFunctionResponse {
  switch (locale) {
    case "ja-JP":
      return {
        response_type: "in_channel",
        text: `\`${word}\` を選んでみました。`
      };
    case "en-US":
    default:
      return {
        response_type: "in_channel",
        text: `I picked out the \`${word}\` for you.`
      };
  }
}

function createSabotageResponse(locale: string): SlashCommandFunctionResponse {
  switch (locale) {
    case "ja-JP":
      return {
        response_type: "in_channel",
        text: "そんな気分にはなれません。¥n皆さんで話し合って決めてください。"
      };
    case "en-US":
    default:
      return {
        response_type: "in_channel",
        text:
          "I'm not in the mood for that.¥nPlease discuss and decide together."
      };
  }
}

export { executeSlashCommand };
