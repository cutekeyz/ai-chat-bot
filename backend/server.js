import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { searchProducts, getProduct, checkStock, createOrder } from "./tools/productionTools.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const PORT = process.env.PORT
const MAX_TOOL_ROUNDS = 5;

app.get("/", (req, res) => {
  res.json({
    message: "AI chatbot backend is running",
  });
});

const availableTools = {
  searchProducts,
  getProduct,
  checkStock,
  createOrder
};

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
  const { message } = req.body;

const tools = [
   {
  type: "function",

  function: {
    name: "searchProducts",

    description:
      "Search the product catalog by product name or maximum price.",

    parameters: {
      type: "object",

      properties: {
        query: {
          type: "string",
          description:
            "A product name or keyword to search for.",
        },

        maxPrice: {
          type: "number",
          description:
            "The maximum price of products to return.",
        },
      },

      required: [],
    },
  },
},

  {
    type: "function",
    function: {
      name: "getProduct",
      description:
        "Get detailed information about a specific product using its product ID.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "integer",
            description:
              "The ID of the product to retrieve.",
          },
        },
        required: ["productId"],
      },
    },
  },

  {
  type: "function",
  function: {
    name: "checkStock",

    description:
      "Check how many units of a product are currently in stock.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "integer",
          description:
            "The ID of the product to check.",
        },
      },

      required: ["productId"],
    },
  },
},

  {
  type: "function",

  function: {
    name: "createOrder",

    description:
      "Create an order for a product when the user explicitly wants to purchase or order something. Use the product ID and quantity. If the product ID is unknown, first use the available product-search tools to identify the product.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "integer",
          description:
            "The ID of the product the user wants to purchase.",
        },

        quantity: {
          type: "integer",
          description:
            "The number of units the user wants to purchase.",
        },
      },

      required: [
        "productId",
        "quantity",
      ],
    },
  },
},

];

    const messages = [
  {
    role: "user",
    content: message,
  },
];

const MAX_TOOL_ROUNDS = 5;

let toolRound = 0;

while (toolRound < MAX_TOOL_ROUNDS) {
  toolRound++;

  console.log(
    `Tool round: ${toolRound}`
  );

  const response =
    await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      tools,
    });

  const assistantMessage =
    response.choices[0].message;

  messages.push(assistantMessage);

  const toolCalls =
    assistantMessage.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    return res.json({
      message: assistantMessage.content,
    });
  }

  for (const toolCall of toolCalls) {
    const toolName =
      toolCall.function.name;

    const args = JSON.parse(
      toolCall.function.arguments
    );

    const toolFunction =
      availableTools[toolName];

    if (!toolFunction) {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: `Unknown tool: ${toolName}`,
        }),
      });

      continue;
    }

    let result;

    try {
      result = await toolFunction(args);
    } catch (error) {
      result = {
        error: `Tool execution failed: ${error.message}`,
      };
    }

    console.log("Tool:", toolName);
    console.log("Arguments:", args);
    console.log("Result:", result);

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    });
  }
}
   
return res.status(500).json({
  error:
    "The AI reached the maximum number of tool calls.",
    })
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});