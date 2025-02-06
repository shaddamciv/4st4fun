/* eslint-disable no-unused-vars */

import {
  ActionExample,
  getEmbeddingZeroVector,
  Handler,
  Memory,
  Validator,
} from "@ai16z/eliza";
import { CollabLandBaseAction } from "./collabland.action.js";
import { randomUUID } from "crypto";
import { tavily } from "@tavily/core";
import { config } from "dotenv";

// Load environment variables
config();

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export class SearchWebAction extends CollabLandBaseAction {
  constructor() {
    const name = "SEARCH_WEB";
    const similes = ["SEARCH", "LOOKUP", "FIND_INFO", "WEB_SEARCH"];
    const description =
      "Search the internet for information about a topic and structure the results";

    const handler: Handler = async (
      runtime,
      message,
      state,
      options,
      callback
    ): Promise<boolean> => {
      try {
        // Extract search query from message
        const searchQuery = message.content.text
          .replace(/^.*?search\s+(?:for|about)?\s*/i, "")
          .trim();

        if (!searchQuery) {
          console.log("State:", state);
          console.log("Options:", options);
          callback?.({
            text: "I couldn't understand what you want me to search for. Could you please rephrase your request?",
            content: {},
          });
          return false;
        }

        // Use Tavily Search API
        const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

        if (!TAVILY_API_KEY) {
          callback?.({
            text: "Search functionality is not configured. Please set up Tavily API credentials.",
            content: {},
          });
          return false;
        }

        // Initialize Tavily client
        const tvly = tavily({ apiKey: TAVILY_API_KEY });

        console.log("#####SearchQuery:##### \n", searchQuery);

        // Perform search with advanced depth and topic-specific settings
        const searchResponse = await tvly.search(searchQuery, {
          searchDepth: "advanced",
          includeAnswer: true, // Get detailed answers
          maxResults: 5,
          topic: "general", // Use general topic for broader coverage
        });

        console.log("#######Search response:###### \n", searchResponse);

        // Format search results
        const formattedResults = searchResponse.results.map(
          (item): SearchResult => ({
            title: item.title,
            url: item.url,
            content: item.content,
          })
        );

        const searchResultsText = formattedResults
          .map(
            (result: SearchResult) =>
              `Title: ${result.title}\nURL: ${result.url}\nSummary: ${result.content}\n`
          )
          .join("\n---\n\n");

        // Update state with search context
        let currentState = state ?? (await runtime.composeState(message));
        currentState = {
          ...currentState,
          searchQuery,
          searchResults: searchResultsText,
        };

        console.log(currentState);

        // Format results as bullet points with sources
        const formatResults = (results: SearchResult[]): string => {
          const bulletPoints = results.map((result) => {
            // Extract the main points from the content
            const points = result.content
              .split(/\.|!|\?/)
              .filter((point) => point.trim().length > 0)
              .map((point) => point.trim())
              .filter((point) => point.length > 30) // Filter out very short segments
              .slice(0, 2) // Take up to 2 main points from each result
              .map((point) => `  • ${point}`);

            return [
              `\n📰 From ${result.title}:`,
              ...points,
              `   Source: ${result.url}\n`,
            ].join("\n");
          });

          return [
            `Here are the latest updates about ${searchQuery}:\n`,
            ...bulletPoints,
            "\n💡 Summary:",
            searchResponse.answer,
          ].join("\n");
        };

        // Generate formatted response
        const response = formatResults(formattedResults);

        // Create memory for search results
        const searchMemory: Memory = {
          id: randomUUID(),
          agentId: message.agentId,
          userId: message.userId,
          roomId: message.roomId,
          content: {
            text: response,
            searchQuery,
            results: formattedResults,
          },
          createdAt: Date.now(),
          embedding: getEmbeddingZeroVector(),
          unique: true,
        };

        // Store search results in memory
        await runtime.databaseAdapter.log({
          body: {
            searchQuery,
            results: formattedResults,
            response,
          },
          userId: message.userId,
          roomId: message.roomId,
          type: "search_results",
        });

        const searchMemoryManager = runtime.getMemoryManager("search");
        if (searchMemoryManager) {
          await searchMemoryManager.createMemory(searchMemory, true);
        }

        callback?.({
          text: String(response),
          content: {
            searchQuery,
            results: formattedResults,
          },
        });

        return true;
      } catch (error) {
        console.error("Error in search web action:", error);
        callback?.({
          text: `I encountered an error while searching: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          content: { error: true },
        });
        return false;
      }
    };

    const validate: Validator = async (
      runtime,
      message,
      state
    ): Promise<boolean> => {
      console.log(
        "Runtime:",
        runtime,
        "\n message:",
        message,
        "\n state:",
        state
      );
      // Always allow search action
      return true;
    };

    const examples: ActionExample[][] = [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Can you search about the latest developments in AI?",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "",
            action: "SEARCH_WEB",
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "Look up recent news about blockchain technology",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "",
            action: "SEARCH_WEB",
          },
        },
      ],
    ];

    super(name, description, similes, examples, handler, validate);
  }
}
