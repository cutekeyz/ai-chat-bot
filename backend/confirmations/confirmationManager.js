import crypto from "crypto";

const pendingActions = new Map();

export const createConfirmation = ({
  toolName,
  arguments: args,
  conversationId,
  toolCallId,
  assistantMessage,
}) => {
  const confirmationId =
    crypto.randomUUID();

  pendingActions.set(confirmationId, {
    toolName,
    toolArguments: args,
    conversationId,
    toolCallId,
    assistantMessage,
  });

  return confirmationId;
};

export const getConfirmation = (
  confirmationId
) => {
  return pendingActions.get(
    confirmationId
  );
};

export const deleteConfirmation = (
  confirmationId
) => {
  pendingActions.delete(
    confirmationId
  );
};