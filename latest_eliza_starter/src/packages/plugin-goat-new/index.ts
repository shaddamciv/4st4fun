import type { Plugin } from "@elizaos/core";
import { getOnChainActions } from "./actions.ts";
import { getWalletClient, getWalletProvider } from "./wallet.ts";

const getSetting = (key: string) => process.env[key];
const walletClient = getWalletClient(getSetting);

async function initializePlugin(): Promise<Plugin> {
  const plugin: Plugin = {
    name: "[GOAT] Exercise Rewards",
    description:
      "AIccountabilityToken rewards for exercise completion on Arbitrum Sepolia",
    providers: walletClient ? [getWalletProvider(walletClient)] : [],
    evaluators: [],
    services: [],
    actions: [],
  };

  if (!walletClient) {
    plugin.description =
      "AIccountabilityToken rewards plugin (Disabled - Wallet not configured)";
    return plugin;
  }

  try {
    const actions = await getOnChainActions(walletClient, getSetting);
    console.log("Actions: ", actions[0].handler);
    plugin.actions = actions;
    return plugin;
  } catch (error) {
    console.error("Failed to initialize GOAT plugin:", error);
    plugin.description = `AIccountabilityToken rewards plugin (Error: ${
      error instanceof Error ? error.message : String(error)
    })`;
    return plugin;
  }
}

// Initialize the plugin
const goatPlugin = await initializePlugin();

console.log("goatPlugin: ", goatPlugin);

export default goatPlugin;
