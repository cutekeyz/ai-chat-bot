import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const PORT = process.env.PORT

app.get("/", (req, res) => {
  res.json({
    message: "AI chatbot backend is running",
  });
});

// FOR STEP ONE

// app.post("/api/chat", async (req, res) => {
//   const { messages } = req.body;

// try {
//     const response = await groq.chat.completions.create({
//      model: "openai/gpt-oss-120b",
//       messages: [
//         {
//           role: "user",
//           content: messages,
//         },
//       ],
//     });

//    res.json({
//     reply: response.choices[0].messages.content,
//    });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       error: "Something went wrong while talking to the AI.",
//     });
//   }
// });



// FOR STEP 2
// app.post("/api/chat", async (req, res) => {
//   const { messages } = req.body;

//   try {
//     const response = await groq.chat.completions.create({
//       model: "openai/gpt-oss-120b",
//       messages,
//     });

//     res.json({
//       reply: response.choices[0].message.content,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       error: "Something went wrong while talking to the AI.",
//     });
//   }
// });


// Use this to check for models available in GROQ

//STEP 3
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  // console.log("1. Request received");

  try {
    // console.log("2. Sending request to Groq...");

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      stream: true,
    });

     res.setHeader("Content-Type", "text/plain; charset=utf-8");

    // console.log("3. Stream created");

    for await (const chunk of stream) {
      // console.log("4. Chunk received:");
      // console.log(chunk);

      const content = chunk.choices[0]?.delta?.content;

      // console.log("Content:", content);

      if (content) {
        res.write(content);
      }
    }

    // console.log("5. Stream finished");

    res.end();
  } catch (error) {
    console.error("STREAM ERROR:");
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Something went wrong while talking to the AI.",
      });
    }
  }
});

app.post("/api/profile", async (req, res) => {
  const { text } = req.body;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: `
        Extract the person's information from the user's text.

        Return:
        - name
        - level
        - course
        - profession

        If information is not provided, use null.
      `,
        },
        {
          role: "user",
          content: text,
        },
      ],

      response_format: {
        type: "json_schema",
        json_schema: {
          name: "person_profile",
          strict: true,
          schema: {
            type: "object",

            properties: {
              name: {
                type: "string",
              },

              level: {
                type: "integer",
              },

              course: {
                type: "string",
              },

              profession: {
                type: "string",
              },
            },

            required: ["name", "level", "course", "profession"],

            additionalProperties: false,
          },
        },
      },
    });

    const rawProfile = response.choices[0]?.message?.content;
    const profile =
      typeof rawProfile === "string" ? JSON.parse(rawProfile) : rawProfile ?? {};

    res.json(profile);
  } catch (error) {
    console.error("PROFILE ERROR:");
    console.error(error);

    res.status(500).json({
      error: "Something went wrong while extracting the profile.",
    });
  }
});

// app.get("/api/models", async (req, res) => {
//   try {
//     const models = await groq.models.list();

//     res.json(models);
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       error: "Could not retrieve Groq models.",
//     });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});