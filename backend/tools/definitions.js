import { tools } from "./index.js";

export const toolDefinitions = tools.map((tool) => ({
  type: "function",

  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));