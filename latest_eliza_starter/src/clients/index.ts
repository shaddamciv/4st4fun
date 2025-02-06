import { AutoClientInterface } from "@elizaos/client-auto";
import { Character, elizaLogger, IAgentRuntime } from "@elizaos/core";

export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime
) {
  const clients = [];
  const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];

  if (clientTypes.includes("auto")) {
    const autoClient = await AutoClientInterface.start(runtime);
    elizaLogger.error("Started Auto")
    if (autoClient) clients.push(autoClient);
  }

  if (character.plugins?.length > 0) {
    for (const plugin of character.plugins) {
      if (plugin.clients) {
        for (const client of plugin.clients) {
          clients.push(await client.start(runtime));
        }
      }
    }
  }

  return clients;
}


// class AutoClient {
//   runtime: IAgentRuntime;
//   constructor(runtime: IAgentRuntime) {
//       this.runtime = runtime;

//       // Start trading loop
//       this.interval = setInterval(() => {
//           this.makeTrades();
//       }, .5 * 60 * 1000); // 1 hour interval
//   }

//   async makeTrades() {
//       // Get recommendations"
//       console.log("Called Auto Client");
//   }
// }