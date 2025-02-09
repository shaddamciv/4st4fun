import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { erc20 } from "@goat-sdk/plugin-erc20";
import type { WalletClientBase } from "@goat-sdk/core";
import {
  composeContext,
  generateText,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
} from "@elizaos/core";

// Define AIccountabilityToken
const AIccountabilityToken = {
  decimals: 18,
  symbol: "ACC",
  name: "AIccountabilityToken",
  chains: {
    "421614": {
      contractAddress:
        "0x4c0b83dbA97884f81930721AfdB68C3DeE62c94C" as `0x${string}`,
    },
  },
};

// Default reward amount for exercise completion (0.1 ACC)
const EXERCISE_REWARD_AMOUNT = "100000000000000000";

export async function getOnChainActions(
  wallet: WalletClientBase,
  getSetting: (key: string) => string | undefined
) {
  const actionsWithoutHandler = [
    {
      name: "SEND_TOKEN",
      description:
        "Send AIccountabilityToken (ACC) as a reward for exercise completion",
      similes: [
        "Like giving a fitness achievement medal",
        "Similar to earning rewards for workout completion",
        "Like getting tokens for staying healthy",
      ],
      validate: async () => true,
      examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "I just completed a 30-minute workout!",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "Great work! Let me send you some ACC tokens as a reward. What's your wallet address?",
            },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: {
              text: "Here's my address: 0x123... I did my exercises today!",
            },
          },
          {
            user: "{{agentName}}",
            content: {
              text: "",
              action: "SEND_TOKEN",
            },
          },
        ],
      ],
    },
  ];

  // Get wallet private key from settings
  const privateKey = getSetting("WALLET_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("Wallet private key not properly configured");
  }

  const tools = await getOnChainTools({
    wallet: wallet,
    plugins: [
      erc20({
        tokens: [AIccountabilityToken],
      }),
    ],
  });

  console.log("Initialized ERC20 tools for exercise rewards:", tools);

  console.log(
    "Action Handler: ",
    actionsWithoutHandler[0].name,
    actionsWithoutHandler[0].description,
    tools as { erc20: any },
    await getActionHandler(
      actionsWithoutHandler[0].name,
      actionsWithoutHandler[0].description,
      tools as { erc20: any }
    )
  );

  return actionsWithoutHandler.map((action) => ({
    ...action,
    handler: getActionHandler(
      action.name,
      action.description,
      tools as { erc20: any }
    ),
  }));
}

function getActionHandler(
  actionName: string,
  actionDescription: string,
  tools: { erc20: any }
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
      // Extract wallet address from the message
      const addressMatch = message.content.text.match(/0x[a-fA-F0-9]{40}/);
      if (!addressMatch) {
        throw new Error("No valid wallet address found in the message");
      }

      const toAddress = addressMatch[0];

      // Call the ERC20 transfer function
      const context = composeActionContext(
        actionName,
        actionDescription,
        currentState
      );

      console.log(
        "token: ",
        AIccountabilityToken,
        "to: ",
        toAddress,
        "EXERCISE_REWARD_AMOUNT: ",
        EXERCISE_REWARD_AMOUNT
      );

      // Use the tools to send tokens
      const result = await tools.erc20.transfer({
        token: AIccountabilityToken,
        to: toAddress,
        amount: EXERCISE_REWARD_AMOUNT,
      });

      console.log("Result: ", result);

      // 2. Compose the response
      const response = composeResponseContext(result, currentState);
      const responseText = await generateResponse(runtime, response);

      callback?.({
        text: responseText,
        content: {},
      });
      return true;
    } catch (error) {
      console.log("Error: ", error);
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

# Exercise Reward Context
- AIccountabilityToken (ACC) is awarded for completing exercises
- Rewards are sent on Arbitrum Sepolia network
- This encourages healthy habits through blockchain rewards

{{recentMessages}}

Based on the action chosen and the previous messages, execute the action and respond to the user using the tools you were given. For exercise completion, send ACC tokens as a reward.
`;

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
