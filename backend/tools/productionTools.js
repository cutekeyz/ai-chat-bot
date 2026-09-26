let orders = [];


const products = [
  {
    id: 1,
    name: "Mechanical Keyboard",
    price: 45000,
    stock: 12,
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 18000,
    stock: 25,
  },
  {
    id: 3,
    name: "USB-C Hub",
    price: 25000,
    stock: 0,
  },
  {
    id: 4,
    name: "Gaming Monitor",
    price: 180000,
    stock: 4,
  },
  {
    id: 5,
    name: "Laptop Stand",
    price: 30000,
    stock: 8,
  },
];

export const searchProducts = ({
  query,
  maxPrice,
}) => {
  return products.filter((product) => {
    const matchesQuery =
      !query ||
      product.name
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesPrice =
      maxPrice === undefined ||
      product.price <= maxPrice;

    return matchesQuery && matchesPrice;
  });
};

export const getProduct = ({ productId }) => {
  const product = products.find((product) => {
    return product.id === productId;
  });

  if (!product) {
    return {
      error: "Product not found.",
      productId,
    };
  }

  return product;
};

export const checkStock = ({ productId }) => {
  const product = products.find((product) => {
    return product.id === productId;
  });

  if (!product) {
    return {
      error: "Product not found.",
    };
  }

  return {
    productId: product.id,
    productName: product.name,
    stock: product.stock,
    inStock: product.stock > 0,
  };
};

export const createOrder = ({
  productId,
  quantity,
}) => {
  const product = products.find((product) => {
    return product.id === productId;
  });

  if (!product) {
    return {
      success: false,
      error: "Product not found.",
    };
  }

  if (quantity <= 0) {
    return {
      success: false,
      error: "Quantity must be greater than zero.",
    };
  }

  if (product.stock < quantity) {
    return {
      success: false,
      error: "Not enough stock.",
      availableStock: product.stock,
    };
  }

  const order = {
    id: orders.length + 1,
    productId: product.id,
    productName: product.name,
    quantity,
    totalPrice: product.price * quantity,
    status: "created",
  };

  orders.push(order);

  product.stock -= quantity;

  return {
    success: true,
    order,
  };
};
