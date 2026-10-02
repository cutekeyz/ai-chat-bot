import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { runAgent } from "./agent/agent.js";
import { toolDefinitions } from "./tools/definitions.js";
import {
  createConfirmation,
  getConfirmation,
  deleteConfirmation,
} from "./confirmations/confirmationManager.js";
import {
  getConversation,
  getOrCreateConversation,
} from "./conversations/conversationStore.js";

import { availableTools } from "./tools/registry.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


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
                type: ["string","null"]
              },

              level: {
                type: ["integer", "null"]
              },

              course: {
                type: ["string", "null"]
              },

              profession: {
                type: ["string", "null"]
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


app.post("/api/tool-test", async (req, res) => {
  const {
    conversationId,
    message,
  } = req.body;

  if (!conversationId) {
    return res.status(400).json({
      error: "conversationId is required.",
    });
  }

  if (!message?.trim()) {
    return res.status(400).json({
      error: "Message is required.",
    });
  }

  try {

      // const messages =
      // getOrCreateConversation(
      //   pendingActions.conversationId
      // );

      const messages =
      getOrCreateConversation(
        conversationId
      );

    messages.push({
      role: "user",
      content: message,
    });

    const result =
      await runAgent(messages);

     if (result.type === "confirmation") {
      const confirmationId =
        createConfirmation({
          toolName: result.tool.name,
          arguments: result.arguments,
          conversationId,
          toolCallId: result.toolCall.id,
          assistantMessage:
            result.assistantMessage,
        });

      return res.json({
        requiresConfirmation: true,
        confirmationId,
        tool: result.tool.name,
        arguments: result.arguments,
      });
    }
    return res.json({
      message: result.message,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong.",
    });
  }
});



app.post("/api/tool-test/confirm", async (req, res) => {
  const { confirmationId } = req.body;

  if (!confirmationId) {
    return res.status(400).json({
      error: "confirmationId is required.",
    });
  }

    const pendingAction =
      getConfirmation(confirmationId);

  if (!pendingAction) {
    return res.status(404).json({
      error:
        "Confirmation request not found or has expired.",
    });
  }

  const tool =
    availableTools[pendingAction.toolName];

  if (!tool) {
    return res.status(400).json({
      error: "Tool no longer exists.",
    });
  }


       const messages =
        getConversation(
          pendingAction.conversationId
        );

  if (!messages) {
    return res.status(404).json({
      error: "Conversation not found.",
    });
  }

  try {
    // 1. Execute the confirmed action
    const result =
      await tool.execute(
        pendingAction.toolArguments
      );

    // 2. Add the tool result to the conversation
      // messages.push(
      // pendingAction.assistantMessage
      // );


    messages.push({
      role: "tool",
      tool_call_id:
        pendingAction.toolCallId,
      content: JSON.stringify(result),
    });

//     console.log(
//   "Messages before final response:"
// );

      console.dir(messages, {
        depth: null,
      });

    // 3. Ask the LLM to interpret the result
      const finalResponse = 
      await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        tools: toolDefinitions,
      });

    // 4. Get the assistant's final response
    const assistantMessage =
      finalResponse.choices[0].message;

    // 5. Save that response to conversation history
    messages.push(assistantMessage);

    // 6. Remove the pending action
    pendingActions.delete(confirmationId);

    // 7. Send the final response to Postman
    return res.json({
      success: true,
      message: assistantMessage.content,
      result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        `Tool execution failed: ${error.message}`,
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});