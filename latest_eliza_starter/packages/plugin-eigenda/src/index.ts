import type { Plugin } from "@elizaos/core";

// Export actions
export * from "./actions/uploadData";
export * from "./actions/retrieveData";
export * from "./actions/getStatus";

// Export utilities and types
export * from "./utils";
export * from "./environment";

// Import actions
import uploadData from "./actions/uploadData";
import retrieveData from "./actions/retrieveData";
import getStatus from "./actions/getStatus";

export const eigendaPlugin: Plugin = {
    name: "eigenda",
    description: "EigenDA is a data availability plugin for storing and retrieving data",
    providers: [],
    evaluators: [],
    services: [],
    actions: [uploadData, retrieveData, getStatus],
};

export default eigendaPlugin;