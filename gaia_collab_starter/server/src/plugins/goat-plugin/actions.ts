import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { polymarket } from "@goat-sdk/plugin-polymarket";
import type { WalletClientBase } from "@goat-sdk/core";
import {
  composeContext,
  generateText,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
} from "@ai16z/eliza";

export async function getOnChainActions(
  wallet: WalletClientBase,
  getSetting: (key: string) => string | undefined
) {
  const actionsWithoutHandler = [
    {
      name: "GET_POLYMARKET_EVENTS",
      description: "Get the list of events and markets on Polymarket",
      similes: [
        "Like browsing a sports betting website to see all upcoming games",
        "Similar to checking a TV guide for upcoming shows",
        "Like viewing an events calendar with filters",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "Show me active events on Polymarket",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_POLYMARKET_EVENTS",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "What events are happening in 2024?",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_POLYMARKET_EVENTS",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Show me political events",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_POLYMARKET_EVENTS",
            },
          },
        ],
      ],
    },
    {
      name: "CREATE_POLYMARKET_ORDER",
      description: "Create a new order on a Polymarket market",
      similes: [
        "Like placing a bet on a sports game",
        "Similar to submitting a stock market order",
        "Like making a prediction with real stakes",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "I want to buy 100 shares at 0.75",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CREATE_POLYMARKET_ORDER",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Sell 50 shares immediately at 0.60 or cancel",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CREATE_POLYMARKET_ORDER",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Buy 200 shares at 0.80, valid for 24 hours",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CREATE_POLYMARKET_ORDER",
            },
          },
        ],
      ],
    },
    {
      name: "GET_POLYMARKET_MARKET_INFO",
      description:
        "Get detailed information about a specific market on Polymarket",
      similes: [
        "Like looking up detailed stats for a specific sports game",
        "Similar to viewing a company's stock profile",
        "Like reading the full description of an event",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "Tell me about market 123",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_POLYMARKET_MARKET_INFO",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "What are the possible outcomes for market 456?",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_POLYMARKET_MARKET_INFO",
            },
          },
        ],
      ],
    },
    {
      name: "GET_ACTIVE_POLYMARKET_ORDERS",
      description: "Get all active orders on Polymarket",
      similes: [
        "Like checking your open bets at a sportsbook",
        "Similar to viewing your pending trades on an exchange",
        "Like reviewing your active predictions",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "Show me my active orders",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_ACTIVE_POLYMARKET_ORDERS",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "What orders do I have in market 123?",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "GET_ACTIVE_POLYMARKET_ORDERS",
            },
          },
        ],
      ],
    },
    {
      name: "CANCEL_POLYMARKET_ORDER",
      description: "Cancel a specific order on Polymarket",
      similes: [
        "Like canceling a pending bet before it's matched",
        "Similar to canceling a limit order on a trading platform",
        "Like taking back a prediction before it's confirmed",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "Cancel my order with ID 123",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CANCEL_POLYMARKET_ORDER",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Remove my pending order 456",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CANCEL_POLYMARKET_ORDER",
            },
          },
        ],
      ],
    },
    {
      name: "CANCEL_ALL_POLYMARKET_ORDERS",
      description: "Cancel all active orders on Polymarket",
      similes: [
        "Like clearing all your pending bets at once",
        "Similar to closing all open positions on an exchange",
        "Like resetting your prediction slate",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "Cancel all my orders",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CANCEL_ALL_POLYMARKET_ORDERS",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Clear all my pending bets",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "CANCEL_ALL_POLYMARKET_ORDERS",
            },
          },
        ],
      ],
    },
  ];

  // Get Polymarket credentials from settings
  const polymarketKey = getSetting("POLYMARKET_API_KEY");
  const polymarketSecret = getSetting("POLYMARKET_SECRET");
  const polymarketPassphrase = getSetting("POLYMARKET_PASSPHRASE");

  if (!polymarketKey || !polymarketSecret || !polymarketPassphrase) {
    throw new Error("Polymarket credentials not properly configured");
  }

  const tools = await getOnChainTools({
    wallet: wallet,
    plugins: [
      polymarket({
        credentials: {
          key: polymarketKey,
          secret: polymarketSecret,
          passphrase: polymarketPassphrase,
        },
      }),
    ],
  });

  console.log("#################Onchain Tools: ", tools);

  return actionsWithoutHandler.map((action) => ({
    ...action,
    handler: getActionHandler(action.name, action.description, tools),
  }));
}

function getActionHandler(
  actionName: string,
  actionDescription: string,
  tools: object
) {
  return async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    let currentState = state ?? (await runtime.composeState(message));
    currentState = await runtime.updateRecentMessageState(currentState);

    try {
      // 1. Call the tools needed
      const context = composeActionContext(
        actionName,
        actionDescription,
        currentState
      );
      const result = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        // Pass tools as part of runtime options
        ...(tools && { tools }),
      });

      // 2. Compose the response
      const response = composeResponseContext(result, currentState);
      const responseText = await generateResponse(runtime, response);

      callback?.({
        text: responseText,
        content: {},
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 3. Compose the error response
      const errorResponse = composeErrorResponseContext(
        errorMessage,
        currentState
      );
      const errorResponseText = await generateResponse(runtime, errorResponse);

      callback?.({
        text: errorResponseText,
        content: { error: errorMessage },
      });
      return false;
    }
  };
}

function composeActionContext(
  actionName: string,
  actionDescription: string,
  state: State
): string {
  const actionTemplate = `
# Knowledge
{{knowledge}}

About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Action: ${actionName}
${actionDescription}

{{recentMessages}}

Based on the action chosen and the previous messages, execute the action and respond to the user using the tools you were given.
`;

  console.log("##############Action Template: ", actionTemplate);
  return composeContext({ state, template: actionTemplate });
}

function composeResponseContext(result: unknown, state: State): string {
  const responseTemplate = `
    # Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

Here is the result:
${JSON.stringify(result)}

{{actions}}

Respond to the message knowing that the action was successful and these were the previous messages:
{{recentMessages}}
  `;
  return composeContext({ state, template: responseTemplate });
}

function composeErrorResponseContext(
  errorMessage: string,
  state: State
): string {
  const errorResponseTemplate = `
# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{actions}}

Respond to the message knowing that the action failed.
The error was:
${errorMessage}

These were the previous messages:
{{recentMessages}}
    `;
  return composeContext({ state, template: errorResponseTemplate });
}

async function generateResponse(
  runtime: IAgentRuntime,
  context: string
): Promise<string> {
  return generateText({
    runtime,
    context,
    modelClass: ModelClass.SMALL,
    stop: [], // Optional stop sequences
  });
}
