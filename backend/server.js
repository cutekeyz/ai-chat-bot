import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { toolDefinitions } from "./tools/definitions.js";
import { availableTools } from "./tools/registry.js";
import crypto from "crypto";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const PORT = process.env.PORT

const pendingActions = new Map();

const conversations = new Map();


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
    // 1. Get existing conversation
    let messages =
      conversations.get(conversationId);

    // 2. Create conversation if it doesn't exist
    if (!messages) {
      messages = [];

      conversations.set(
        conversationId,
        messages
      );
    }

    // 3. Add user's message
    messages.push({
      role: "user",
      content: message,
    });

    const MAX_TOOL_ROUNDS = 5;

    let toolRound = 0;

    // 4. Start agent loop
    while (toolRound < MAX_TOOL_ROUNDS) {
      toolRound++;

      console.log(
        `Tool round: ${toolRound}`
      );

      const response =
        await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages,
          tools: toolDefinitions,
        });

      // 5. Get AI response
      const assistantMessage =
        response.choices[0].message;

      // 6. Save AI response
      messages.push(assistantMessage);

      const toolCalls =
        assistantMessage.tool_calls;

      // 7. No tools → final answer
      if (
        !toolCalls ||
        toolCalls.length === 0
      ) {
        return res.json({
          message: assistantMessage.content,
        });
      }

      // 8. Execute requested tools
      for (const toolCall of toolCalls) {
        const toolName =
          toolCall.function.name;

        let args;

        // 9. Parse arguments
        try {
          args = JSON.parse(
            toolCall.function.arguments
          );
        } catch (error) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error:
                "Invalid tool arguments.",
            }),
          });

          continue;
        }

        // 10. Find tool
        const tool =
          availableTools[toolName];

        if (!tool) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error:
                `Unknown tool: ${toolName}`,
            }),
          });

          continue;
        }

        // 11. Check confirmation
        if (tool.requiresConfirmation) {
          const confirmationId =
            crypto.randomUUID();

          pendingActions.set(
            confirmationId,
            {
              toolName: tool.name,
              arguments: args,
              conversationId,
              toolCallId: toolCall.id,
            }
          );

          return res.json({
            requiresConfirmation: true,
            confirmationId,
            tool: tool.name,
            arguments: args,
          });
        }

        // 12. Execute tool
        try {
          const result =
            await tool.execute(args);

          console.log(
            "Tool:",
            toolName
          );

          console.log(
            "Arguments:",
            args
          );

          console.log(
            "Result:",
            result
          );

          // 13. Save tool result
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content:
              JSON.stringify(result),
          });
        } catch (error) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error:
                `Tool execution failed: ${error.message}`,
            }),
          });
        }
      }
    }

    return res.status(500).json({
      error:
        "The AI reached the maximum number of tool calls.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Something went wrong.",
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
    pendingActions.get(confirmationId);

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
    conversations.get(
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
        pendingAction.arguments
      );

    // 2. Add the tool result to the conversation
    messages.push({
      role: "tool",
      tool_call_id:
        pendingAction.toolCallId,
      content: JSON.stringify(result),
    });

    // 3. Ask the LLM to interpret the result
    const finalResponse =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
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