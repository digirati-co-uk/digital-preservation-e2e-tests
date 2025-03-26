import type { FullResult, Reporter, TestCase } from '@playwright/test/reporter';
import {Block, ChatPostMessageArguments, KnownBlock, WebClient} from '@slack/web-api';

export type SlackReporterOptions = {
  channel?: string;
  token?: string;
};

class SlackReporter implements Reporter {
  private readonly channel?: string;
  private readonly client: WebClient;
  private readonly tests: Record<string, TestCase> = {};

  constructor(options: SlackReporterOptions = {}) {
    this.client = new WebClient(options.token);
    this.channel = options.channel;
  }

  async createMessage(
    channel: string,
    body: Partial<ChatPostMessageArguments>
  ): Promise<string> {

    const self = await this.client.auth.test();
    if (!self.bot_id) {
      throw new Error('Not a bot token');
    }

    // @ts-ignore
    const response = await this.client.chat.postMessage({
      channel,
      ...body,
    });

    if (!response.message) {
      throw new Error('Failed to post Slack message');
    }

    return response.message.ts!;

  }

  async onEnd(result: FullResult) {
    if (!this.channel) {
      return;
    }

    console.log(`Sending notification to ${this.channel}`);

    const messageBody = {
      text: 'Test run completed',
      ...this.createMessageBlock(result, Object.values(this.tests)),
    };

    const message = await this.createMessage(this.channel, messageBody);
    if (!message) {
      console.warn('Slack message had no timestamp');
      return;
    }
  }

  onTestEnd(test: TestCase): void {
    this.tests[test.id] = test;
  }

  createMessageBlock(result: FullResult, tests: TestCase[]): Partial<ChatPostMessageArguments> {
    const passing = tests.filter((r) => r.ok());
    const failing = tests.filter((r) => !r.ok());

    const admonition = result.status === 'passed' ? ':white_check_mark:' : ':warning:';
    const date = new Date();

    const blocks: (Block | KnownBlock)[] = [
      {
        accessory: {
          text: {
            emoji: true,
            text: 'View',
            type: 'plain_text',
          },
          type: 'button',
          url: process.env.GITHUB_REPORT_OUTPUT,
        },
        fields: [
          {
            text: '*Tests Failing*',
            type: 'mrkdwn',
          },
          {
            text: `*Tests Passing*`,
            type: 'mrkdwn',
          },
          {
            text: `${failing.length}`,
            type: 'mrkdwn',
          },
          {
            text: `${passing.length}`,
            type: 'mrkdwn',
          },
        ],
        text: {
          text: `*Test Run ${result.status}* on *${process.env.PLAYWRIGHT_ENVIRONMENT}* at ${date.getHours()}:${date.getMinutes()} ${admonition}`,
          type: 'mrkdwn',
        },
        type: 'section',
      },
      {
        text: {
          text: `*<${process.env.GITHUB_REPORT_OUTPUT}|See test results>*`,

          type: 'mrkdwn',
        },
        type: 'section',
      },
    ];

    return {
      blocks,
    };
  }
}

export default SlackReporter;
