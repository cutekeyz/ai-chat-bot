import Groq from "groq-sdk";

import { toolDefinitions } from "../tools/definitions.js";
import { availableTools } from "../tools/registry.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const runAgent = async (messages) => {
  const MAX_TOOL_ROUNDS = 5;

  let toolRound = 0;

  while (toolRound < MAX_TOOL_ROUNDS) {
    toolRound++;

    const response =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        tools: toolDefinitions,
      });

    const assistantMessage =
      response.choices[0].message;

    messages.push(assistantMessage);

    const toolCalls =
      assistantMessage.tool_calls;

    if (
      !toolCalls ||
      toolCalls.length === 0
    ) {
      return {
        type: "message",
        message: assistantMessage.content,
      };
    }

    for (const toolCall of toolCalls) {
      const toolName =
        toolCall.function.name;

      let args;

      try {
        args = JSON.parse(
          toolCall.function.arguments
        );
      } catch (error) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: "Invalid tool arguments.",
          }),
        });

        continue;
      }

      const tool =
        availableTools[toolName];

      if (!tool) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error:
              `Unknown tool: ${toolName}`,
          }),
        });

        continue;
      }

      if (tool.requiresConfirmation) {
        return {
          type: "confirmation",
          tool,
          toolCall,
          arguments: args,
        };
      }

      try {
        const result =
          await tool.execute(args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch (error) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error:
              `Tool execution failed: ${error.message}`,
          }),
        });
      }
    }
  }

  throw new Error(
    "The AI reached the maximum number of tool calls."
  );
};