import { useEffect, useRef, useState } from "react";

const ChatBot = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const abortControllerRef = useRef(null);
  const controller = new AbortController();
  abortControllerRef.current = controller;

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);


const sendMessage = async () => {
  if (!input.trim()) return;

  setError("");
  setLoading(true);

  const userMessage = {
    role: "user",
    content: input,
  };

  const updatedMessages = [...messages, userMessage];

  // Show the user's message and create an empty
  // assistant message for the incoming response
  setMessages([
    ...updatedMessages,
    {
      role: "assistant",
      content: "",
    },
  ]);

  setInput("");

  try {
    const response = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
       signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Something went wrong.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, {
      stream: true,
      });


      // Update the assistant message with the new chunk
      setMessages((previousMessages) => {
        const updatedMessages = [...previousMessages];

        const lastIndex = updatedMessages.length - 1;

        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          content:
            updatedMessages[lastIndex].content + chunk,
        };

        return updatedMessages;
      });
    }
  } catch (error) {
    console.error(error);
    setError("Sorry, something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

const stopGeneration = () => {
  abortControllerRef.current?.abort();
};

const handleKeyDown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-black h-16 border-b border-zinc-800 flex items-center px-4 sm:px-6">
        <div className="w-full">
          <h1 className="text-lg font-bold font-inter">
            Tech Success Chatbot
          </h1>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto mt-10 mb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="text-xl rounded-lg py-2 bg-[#4CBB17]/90 px-8 font-inter tracking-wider">Your AI Chat Bot</span>
              </div>

              <h2 className="text-2xl font-semibold mb-2 font-jetBrains">
                How can I help you?
              </h2>

              <p className="text-zinc-400 max-w-md">
                Ask me anything and I'll do my best to help.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {/* AI avatar */}
                {message.role === "assistant" && (
                  <div className="flex items-center justify-center shrink-0">
                    <span className="text-lg font-semibold rounded-sm bg-[#4CBB17] px-2 py-1 text-black">
                      Ai
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#4CBB17] text-black"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-7">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Generating indicator */}
          {loading && (
            <div className="flex items-center gap-2 mt-6 text-sm text-zinc-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
              </div>

              <span>Generating...</span>
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <footer className="fixed bottom-0 w-full border-t border-zinc-800 bg-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 focus-within:border-zinc-500">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AI..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none"
            />

            {loading ? (
              <button
                onClick={stopGeneration}
                className="rounded-xl bg-[#dc0000]/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#dc0000]/60"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="rounded-xl bg-[#4CBB17]/90 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-[#4CBB17]/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Send
              </button>
            )}
          </div>

          <p className="mt-2 text-center text-xs text-zinc-600">
            AI can make mistakes. Check important information.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ChatBot;