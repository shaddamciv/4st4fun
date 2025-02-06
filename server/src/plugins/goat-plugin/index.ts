import type { Plugin } from "@ai16z/eliza";
import { getOnChainActions } from "./actions.js";
import { getWalletClient, getWalletProvider } from "./wallet.js";

const getSetting = (key: string) => process.env[key];
const walletClient = getWalletClient(getSetting);

async function initializePlugin(): Promise<Plugin> {
  const plugin: Plugin = {
    name: "[GOAT] Onchain Actions",
    description: "Polygon integration plugin",
    providers: walletClient ? [getWalletProvider(walletClient)] : [],
    evaluators: [],
    services: [],
    actions: [],
  };

  if (!walletClient) {
    plugin.description =
      "Polygon integration plugin (Disabled - Wallet not configured)";
    return plugin;
  }

  try {
    const actions = await getOnChainActions(walletClient, getSetting);
    plugin.actions = actions;
    return plugin;
  } catch (error) {
    console.error("Failed to initialize GOAT plugin:", error);
    plugin.description = `Polygon integration plugin (Error: ${error instanceof Error ? error.message : String(error)})`;
    return plugin;
  }
}

// Initialize the plugin
const goatPlugin = await initializePlugin();

export default goatPlugin;
