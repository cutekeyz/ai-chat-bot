import { availableTools } from "../tools/registry.js";
import {
  canExecuteAutomatically,
} from "./executionPolicy.js";

export const executeToolCall = async (toolCall) => {
  const toolName = toolCall.function.name;

  let args;

  try {
    args = JSON.parse(
      toolCall.function.arguments
    );
  } catch (error) {
    return {
      success: false,
      error: "Invalid tool arguments.",
    };
  }

  const tool = availableTools[toolName];

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  }

   if (!canExecuteAutomatically(tool)) {
  return {
    success: false,
    requiresConfirmation: true,
    tool,
    toolCall,
    arguments: args,
  };
}

  try {
    const result =
      await tool.execute(args);

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Tool execution failed: ${error.message}`,
    };
  }
};