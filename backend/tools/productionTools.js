const products = [
  {
    id: 1,
    name: "Mechanical Keyboard",
    price: 45000,
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 18000,
  },
  {
    id: 3,
    name: "USB-C Hub",
    price: 25000,
  },
  {
    id: 4,
    name: "Gaming Monitor",
    price: 180000,
  },
  {
    id: 5,
    name: "Laptop Stand",
    price: 30000,
  },
];

export const searchProducts = ({ maxPrice }) => {
  return products.filter((product) => {
    return product.price <= maxPrice;
  });
};