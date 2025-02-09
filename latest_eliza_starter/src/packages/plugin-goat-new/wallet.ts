import type { WalletClientBase } from "@goat-sdk/core";
import { viem } from "@goat-sdk/wallet-viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

// Using Arbitrum Sepolia for AIccountabilityToken
export const chain = arbitrumSepolia;

interface WalletConfig {
  privateKey: string;
  providerUrl: string;
}

function validatePrivateKey(key: string): `0x${string}` {
  if (!key.startsWith("0x")) {
    throw new Error("EVM_PRIVATE_KEY must start with '0x'");
  }
  if (key.length !== 66) {
    throw new Error(
      "EVM_PRIVATE_KEY must be 32 bytes (64 characters) plus '0x' prefix"
    );
  }
  return key as `0x${string}`;
}

function getWalletConfig(
  getSetting: (key: string) => string | undefined
): WalletConfig | null {
  const privateKey = getSetting("EVM_PRIVATE_KEY");
  const providerUrl = getSetting("EVM_PROVIDER_URL");

  if (!privateKey) {
    console.warn("EVM_PRIVATE_KEY not configured");
    return null;
  }

  if (!providerUrl) {
    throw new Error("EVM_PROVIDER_URL not configured");
  }

  return { privateKey, providerUrl };
}

export function getWalletClient(
  getSetting: (key: string) => string | undefined
): WalletClientBase | null {
  const config = getWalletConfig(getSetting);
  if (!config) return null;

  try {
    const wallet = createWalletClient({
      account: privateKeyToAccount(validatePrivateKey(config.privateKey)),
      chain: chain,
      transport: http(config.providerUrl),
    });

    return viem(wallet);
  } catch (error) {
    console.error("Failed to create wallet client:", error);
    throw new Error(
      `Wallet initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export interface WalletProvider {
  get(): Promise<string | null>;
}

export function getWalletProvider(
  walletClient: WalletClientBase
): WalletProvider {
  return {
    async get(): Promise<string | null> {
      try {
        const address = walletClient.getAddress();
        const balance = await walletClient.balanceOf(address);
        const chainName = chain.name;
        return `EVM Wallet Address (${chainName}): ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}`;
      } catch (error) {
        console.error("Error in EVM wallet provider:", error);
        return null;
      }
    },
  };
}
