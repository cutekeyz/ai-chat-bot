export const canExecuteAutomatically = (
  tool
) => {
  if (tool.permission === "read") {
    return true;
  }

  return false;
};