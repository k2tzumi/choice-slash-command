import { SlackApiClient } from "../src/SlackApiClient";

console.warn = jest.fn();

const mockFetch = jest.fn();
let response: {};

UrlFetchApp.fetch = mockFetch;

const responseMock = {
  getResponseCode: jest.fn(function() {
    return 200;
  }),
  getContentText: jest.fn(function() {
    return JSON.stringify(response);
  })
};
mockFetch.mockReturnValue(responseMock);

describe("SlackApiClient", () => {
  describe("chatScheduleMessage", () => {
    it("success", () => {
      const client = new SlackApiClient("token");
      response = { ok: true, scheduled_message_id: 1 };
      const actual = client.chatScheduleMessage(
        "channel",
        new Date("Mon, 06 Mar 2017 21:22:23 +0000"),
        null,
        [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "header"
            }
          },
          { type: "divider" },
          {
            type: "context",
            elements: [{ type: "plain_text", text: "context" }]
          }
        ]
      );
      expect(mockFetch.mock.calls[0][0]).toContain("chat.scheduleMessage");
      expect(mockFetch.mock.calls[0][1]).toHaveProperty(
        "payload",
        '{"channel":"channel","post_at":1488835343,"blocks":[{"type":"header","text":{"type":"plain_text","text":"header"}},{"type":"divider"},{"type":"context","elements":[{"type":"plain_text","text":"context"}]}],"text":"header\\ncontext"}'
      );
      expect(actual).toBe(1);
    });
  });
  describe("conversationsHistory", () => {
    it("success", () => {
      const client = new SlackApiClient("token");
      response = { ok: true, messages: { test: true } };
      const actual = client.conversationsHistory(
        "channel",
        "latest",
        null,
        "oldest"
      );
      expect(mockFetch.mock.calls[1][0]).toContain(
        "conversations.history?channel=channel&inclusive=true&latest=latest&oldest=oldest"
      );
      expect(actual).toHaveProperty("test", true);
    });
  });
  describe("usersInfo", () => {
    it("success", () => {
      const client = new SlackApiClient("token");
      response = {
        ok: true,
        user: {
          id: "W012A3CDE",
          team_id: "T012AB3C4",
          name: "spengler",
          deleted: false,
          color: "9f69e7",
          real_name: "Egon Spengler",
          tz: "America/Los_Angeles",
          tz_label: "Pacific Daylight Time",
          tz_offset: -25200,
          profile: {
            avatar_hash: "ge3b51ca72de",
            status_text: "Print is dead",
            status_emoji: ":books:",
            real_name: "Egon Spengler",
            display_name: "spengler",
            real_name_normalized: "Egon Spengler",
            display_name_normalized: "spengler",
            email: "spengler@ghostbusters.example.com",
            image_original:
              "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_24: "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_32: "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_48: "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_72: "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_192:
              "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            image_512:
              "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg",
            team: "T012AB3C4"
          },
          is_admin: true,
          is_owner: false,
          is_primary_owner: false,
          is_restricted: false,
          is_ultra_restricted: false,
          is_bot: false,
          updated: 1502138686,
          is_app_user: false,
          has_2fa: false,
          locale: "en-US"
        }
      };
      const actual = client.usersInfo("W012A3CDE");
      expect(mockFetch.mock.calls[2][0]).toContain(
        "users.info?user=W012A3CDE&include_locale=true"
      );
      expect(actual).toHaveProperty("locale", "en-US");
    });
  });
});
