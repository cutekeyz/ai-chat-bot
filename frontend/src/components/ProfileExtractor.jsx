import { useState } from "react";

const ProfileExtractor = () => {
  const [text, setText] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractProfile = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setProfile(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/profile",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: text,
          }),
        }
      );

         console.log("Response status:", response.status);
    console.log("Response OK:", response.ok);

      const result = await response.json();
      console.log("Backend response:", result);
    

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

      setProfile(result);
      
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong while extracting the profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">
          AI Profile Extractor
        </h1>

        <p className="mb-6 text-zinc-400">
          Give the AI some information about a person and it will
          extract the structured information.
        </p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Example: My name is John. I'm a 300-level student studying Economics and I'm a web developer."
          rows={6}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />

        <button
          onClick={extractProfile}
          disabled={!text.trim() || loading}
          className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Extracting..." : "Extract Profile"}
        </button>

        {error && (
          <p className="mt-6 text-sm text-red-400">
            {error}
          </p>
        )}
        
         {profile && (
        <div className="mt-8 text-white bg-black">
          <h2>Extracted Profile</h2>

          <p>Name: {profile.name}</p>
          <p>Level: {profile.level}</p>
          <p>Course: {profile.course}</p>
          <p>Profession: {profile.profession}</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProfileExtractor;