import { useState } from "react";

const ProductAssistant = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/tool-test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input,
          }),
        }
      );

      const result = await response.json();

      console.log("Backend response:", result);

      if (!response.ok) {
        throw new Error(
          result.error || "Something went wrong."
        );
      }

      setResponse(result.message);
    } catch (error) {
      console.error(error);

      setResponse(
        "Something went wrong while talking to the AI."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">
          AI Product Assistant
        </h1>

        <p className="mt-2 text-zinc-400">
          Ask me to find products.
        </p>

        <textarea
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder="Example: Show me products under ₦50,000"
          rows={5}
          className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none placeholder:text-zinc-500"
        />

        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Searching..." : "Ask AI"}
        </button>

        {response && (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 font-medium">
              AI Response
            </h2>

            <p className="text-zinc-300">
              {response}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAssistant;