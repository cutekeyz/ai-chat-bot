const conversations = new Map();

export const getConversation = (conversationId) => {
  return conversations.get(conversationId);
};

export const createConversation = (conversationId) => {
  const messages = [];

  conversations.set(conversationId, messages);

  return messages;
};

export const getOrCreateConversation = (
  conversationId
) => {
  let messages = getConversation(conversationId);

  if (!messages) {
    messages =
      createConversation(conversationId);
  }

  return messages;
};