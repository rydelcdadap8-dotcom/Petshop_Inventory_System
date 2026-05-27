const pool = require("./pool");

const products = [
  {
    name: "Premium Cat Food Tuna 1kg",
    category: "Cat Food",
    sku: "CAT-FOOD-TUNA-1KG",
    barcode: "480100000001",
    unit: "bag",
    quantity: 25,
    costPrice: 180,
    price: 260,
    lowStockLimit: 5,
    supplier: "Happy Paws Supply",
    description: "Tuna-flavored dry food for adult cats."
  },
  {
    name: "Kitten Milk Replacement 300g",
    category: "Cat Food",
    sku: "CAT-MILK-300G",
    barcode: "480100000002",
    unit: "can",
    quantity: 18,
    costPrice: 220,
    price: 335,
    lowStockLimit: 4,
    supplier: "Happy Paws Supply",
    description: "Milk supplement for kittens."
  },
  {
    name: "Clumping Cat Litter Lavender 5L",
    category: "Cat Litter",
    sku: "CAT-LITTER-LAV-5L",
    barcode: "480100000003",
    unit: "bag",
    quantity: 30,
    costPrice: 160,
    price: 245,
    lowStockLimit: 6,
    supplier: "Pet Essentials PH",
    description: "Lavender-scented clumping litter."
  },
  {
    name: "Dog Food Chicken 2kg",
    category: "Dog Food",
    sku: "DOG-FOOD-CHICKEN-2KG",
    barcode: "480100000004",
    unit: "bag",
    quantity: 22,
    costPrice: 320,
    price: 455,
    lowStockLimit: 5,
    supplier: "Canine Care Supply",
    description: "Chicken-flavored dry food for adult dogs."
  },
  {
    name: "Puppy Food Small Breed 1.5kg",
    category: "Dog Food",
    sku: "DOG-PUPPY-SMALL-1-5KG",
    barcode: "480100000005",
    unit: "bag",
    quantity: 16,
    costPrice: 300,
    price: 430,
    lowStockLimit: 4,
    supplier: "Canine Care Supply",
    description: "Small-breed puppy food."
  },
  {
    name: "Dog Chew Toy Bone",
    category: "Toys",
    sku: "DOG-TOY-BONE",
    barcode: "480100000006",
    unit: "pc",
    quantity: 35,
    costPrice: 65,
    price: 120,
    lowStockLimit: 8,
    supplier: "Pet Essentials PH",
    description: "Durable chew toy for dogs."
  },
  {
    name: "Cat Feather Wand Toy",
    category: "Toys",
    sku: "CAT-TOY-FEATHER",
    barcode: "480100000007",
    unit: "pc",
    quantity: 28,
    costPrice: 45,
    price: 95,
    lowStockLimit: 8,
    supplier: "Pet Essentials PH",
    description: "Interactive feather wand for cats."
  },
  {
    name: "Tick and Flea Dog Shampoo 500ml",
    category: "Grooming",
    sku: "DOG-SHAMPOO-FLEA-500ML",
    barcode: "480100000008",
    unit: "bottle",
    quantity: 14,
    costPrice: 140,
    price: 230,
    lowStockLimit: 4,
    supplier: "Clean Coat Labs",
    description: "Shampoo for tick and flea control."
  },
  {
    name: "Cat Grooming Brush",
    category: "Grooming",
    sku: "CAT-BRUSH-GROOM",
    barcode: "480100000009",
    unit: "pc",
    quantity: 20,
    costPrice: 85,
    price: 160,
    lowStockLimit: 5,
    supplier: "Clean Coat Labs",
    description: "Soft grooming brush for cats."
  },
  {
    name: "Pet Multivitamin Drops 60ml",
    category: "Vitamins",
    sku: "PET-VIT-DROPS-60ML",
    barcode: "480100000010",
    unit: "bottle",
    quantity: 12,
    costPrice: 120,
    price: 210,
    lowStockLimit: 4,
    supplier: "VetCare Supply",
    description: "Daily multivitamin supplement for pets."
  },
  {
    name: "Deworming Tablet for Dogs",
    category: "Medicine",
    sku: "DOG-DEWORM-TAB",
    barcode: "480100000011",
    unit: "tablet",
    quantity: 40,
    costPrice: 35,
    price: 75,
    lowStockLimit: 10,
    supplier: "VetCare Supply",
    description: "Deworming tablet for dogs."
  },
  {
    name: "Pet Carrier Medium",
    category: "Accessories",
    sku: "PET-CARRIER-MED",
    barcode: "480100000012",
    unit: "pc",
    quantity: 8,
    costPrice: 620,
    price: 950,
    lowStockLimit: 2,
    supplier: "Pet Essentials PH",
    description: "Medium pet carrier for cats and small dogs."
  }
];

async function seedProducts() {
  let inserted = 0;

  for (const product of products) {
    const result = await pool.query(
      `
        INSERT INTO products (
          name,
          category,
          sku,
          barcode,
          unit,
          quantity,
          cost_price,
          price,
          low_stock_limit,
          supplier,
          description
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        WHERE NOT EXISTS (
          SELECT 1 FROM products WHERE sku = $3
        )
      `,
      [
        product.name,
        product.category,
        product.sku,
        product.barcode,
        product.unit,
        product.quantity,
        product.costPrice,
        product.price,
        product.lowStockLimit,
        product.supplier,
        product.description
      ]
    );

    inserted += result.rowCount;
  }

  return inserted;
}

seedProducts()
  .then((inserted) => {
    console.log(`Seeded ${inserted} product(s).`);
  })
  .catch((error) => {
    console.error("Failed to seed products:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
