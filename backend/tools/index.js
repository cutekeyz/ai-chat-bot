import {
  searchProducts,
  getProduct,
  checkStock,
  createOrder,
} from "./productionTools.js";

export const tools = [
  {
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

    execute: searchProducts,
  },

  {
    name: "getProduct",

    description:
      "Get detailed information about a specific product using its product ID.",

    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description:
            "The ID of the product.",
        },
      },
      required: ["productId"],
    },

    execute: getProduct,
  },

  {
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

    execute: checkStock,
  },

  {
    name: "createOrder",

    description:
      "Create an order for a product when the user explicitly wants to purchase or order something.",

    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description:
            "The ID of the product to purchase.",
        },

        quantity: {
          type: "integer",
          description:
            "The number of units to purchase.",
        },
      },
      required: ["productId", "quantity"],
    },

    execute: createOrder,
  },
];