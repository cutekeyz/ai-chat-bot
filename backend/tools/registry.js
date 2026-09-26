import { tools } from "./index.js";

export const availableTools = Object.fromEntries(
  tools.map((tool) => [
    tool.name,
    tool.execute,
  ])
);