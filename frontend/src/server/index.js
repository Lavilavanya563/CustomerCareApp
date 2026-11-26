
const express = require("express");
const crypto = require("crypto");

const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const app = express();

app.use(cors());
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`
  );
  next();
});

// Public health-check route
app.get("/", (req, res) => {
  res.send("CustomerCareApp backend is running!");
});

// Verify Supabase access token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access token is required. Please log in."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired access token. Please log in again."
      });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);

    return res.status(401).json({
      error: "Unable to verify access token."
    });
  }
};

// All API routes below require authentication
app.use(verifyToken);

// -------------------- TEST DATABASE --------------------

app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .limit(5);

  if (error) {
    console.error("Database error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// -------------------- CUSTOMERS API --------------------

// GET all customers
app.get("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get customers error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// GET one customer
app.get("/customers/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    console.error("Get customer error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: "Customer not found."
    });
  }

  res.json(data);
});
 // TEMPORARY: Test customer list separately
app.get("/customers-test", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*");

  if (error) {
    console.error("Customer test error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});


// POST new customer
app.post("/customers", async (req, res) => {
  const { whatsapp_number } = req.body;

  if (
    typeof whatsapp_number !== "string" ||
    !whatsapp_number.trim()
  ) {
    return res.status(400).json({
      error: "WhatsApp number is required."
    });
  }

  const cleanNumber = whatsapp_number.trim();

  const { data: existingCustomer, error: checkError } =
    await supabase
      .from("customers")
      .select("id")
      .eq("whatsapp_number", cleanNumber)
      .maybeSingle();

  if (checkError) {
    console.error("Duplicate check error:", checkError.message);
    return res.status(500).json({
      error: checkError.message
    });
  }

  if (existingCustomer) {
    return res.status(409).json({
      error: "This WhatsApp number already exists."
    });
  }

  const customerData = {
    ...req.body,
    whatsapp_number: cleanNumber
  };

  const { data, error } = await supabase
    .from("customers")
    .insert([customerData])
    .select()
    .single();

  if (error) {
    console.error("Add customer error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "This WhatsApp number already exists."
      });
    }

    return res.status(400).json({
      error: error.message
    });
  }

  res.status(201).json(data);
});

// PATCH update customer
app.patch("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      error: "Please provide customer details to update."
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      updateData,
      "whatsapp_number"
    )
  ) {
    if (
      typeof updateData.whatsapp_number !== "string" ||
      !updateData.whatsapp_number.trim()
    ) {
      return res.status(400).json({
        error: "WhatsApp number cannot be empty."
      });
    }

    updateData.whatsapp_number =
      updateData.whatsapp_number.trim();

    const { data: existingCustomer, error: checkError } =
      await supabase
        .from("customers")
        .select("id")
        .eq("whatsapp_number", updateData.whatsapp_number)
        .neq("id", id)
        .maybeSingle();

    if (checkError) {
      console.error("Update duplicate check error:", checkError.message);
      return res.status(500).json({
        error: checkError.message
      });
    }

    if (existingCustomer) {
      return res.status(409).json({
        error: "This WhatsApp number already belongs to another customer."
      });
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Update customer error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "This WhatsApp number already exists."
      });
    }

    return res.status(400).json({
      error: error.message
    });
  }

  if (!data) {
    return res.status(404).json({
      error: "Customer not found."
    });
  }

  res.json(data);
});

// DELETE a customer
app.delete("/customers/:id", async (req, res) => {
  try {
    console.log("DELETE CUSTOMER ROUTE HIT:", req.params.id);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Customer ID is required."
      });
    }

    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Delete customer error:", error.message);

      return res.status(400).json({
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        error: "Customer not found."
      });
    }

    return res.status(200).json({
      message: "Customer deleted successfully.",
      id: data.id
    });

  } catch (error) {
    console.error("Delete customer server error:", error);

    return res.status(500).json({
      error: "Internal server error."
    });
  }
});



// -------------------- PRODUCTS API --------------------

// GET all products
app.get("/products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get products error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// GET one product by ID
app.get("/products/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    console.error("Get product error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: "Product not found."
    });
  }

  res.json(data);
});

// POST add a product
app.post("/products", async (req, res) => {
  const {
    sku,
    name,
    description,
    category,
    price_paise,
    stock_quantity,


    active
  } = req.body;

  if (typeof sku !== "string" || !sku.trim()) {
    return res.status(400).json({
      error: "SKU is required."
    });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      error: "Product name is required."
    });
  }

  if (
    price_paise === undefined ||
    price_paise === null ||
    price_paise === "" ||
    !Number.isSafeInteger(Number(price_paise)) ||
    Number(price_paise) < 0
  ) {
    return res.status(400).json({
      error: "Price must be a non-negative whole number in paise."
    });
  }

  if (
    stock_quantity === undefined ||
    stock_quantity === null ||
    stock_quantity === "" ||
    !Number.isSafeInteger(Number(stock_quantity)) ||
    Number(stock_quantity) < 0
  ) {
    return res.status(400).json({
      error: "Stock quantity must be a non-negative whole number."
    });
  }

  if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({
      error: "Active must be true or false."
    });
  }

  const cleanSku = sku.trim();

  // Check duplicate SKU
  const { data: existingProduct, error: checkError } =
    await supabase
      .from("products")
      .select("id")
      .eq("sku", cleanSku)
      .maybeSingle();

  if (checkError) {
    console.error("Duplicate SKU check error:", checkError.message);
    return res.status(500).json({
      error: checkError.message
    });
  }

  if (existingProduct) {
    return res.status(409).json({
      error: "This SKU already exists."
    });
  }

  const productData = {
    sku: cleanSku,
    name: name.trim(),
    description: description ?? null,
    category: category ?? null,
    price_paise: Number(price_paise),
    stock_quantity: Number(stock_quantity),
    active: active ?? true
  };

  const { data, error } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error("Add product error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "This SKU already exists."
      });
    }

    return res.status(400).json({
      error: error.message
    });
  }

  res.status(201).json(data);
});

// PATCH update a product
app.patch("/products/:id", async (req, res) => {
  const updateData = { ...req.body };

  // Prevent changing ID and creation timestamp
  delete updateData.id;
  delete updateData.created_at;

  const allowedFields = [
    "sku",
    "name",
    "description",
    "category",
    "price_paise",
    "stock_quantity",
    "active"
  ];

  const requestedFields = Object.keys(updateData);

  if (
    requestedFields.length === 0 ||
    requestedFields.some(field => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      error: "Please provide valid product details to update."
    });
  }

  if (Object.hasOwn(updateData, "sku")) {
    if (
      typeof updateData.sku !== "string" ||
      !updateData.sku.trim()
    ) {
      return res.status(400).json({
        error: "SKU cannot be empty."
      });
    }

    updateData.sku = updateData.sku.trim();

    const { data: existingProduct, error: checkError } =
      await supabase
        .from("products")
        .select("id")
        .eq("sku", updateData.sku)
        .neq("id", req.params.id)
        .maybeSingle();

    if (checkError) {
      console.error("Update SKU check error:", checkError.message);
      return res.status(500).json({
        error: checkError.message
      });
    }

    if (existingProduct) {
      return res.status(409).json({
        error: "This SKU already exists."
      });
    }
  }

  if (Object.hasOwn(updateData, "name")) {
    if (
      typeof updateData.name !== "string" ||
      !updateData.name.trim()
    ) {
      return res.status(400).json({
        error: "Product name cannot be empty."
      });
    }

    updateData.name = updateData.name.trim();
  }

  if (Object.hasOwn(updateData, "price_paise")) {
    if (
      updateData.price_paise === "" ||
      updateData.price_paise === null ||
      !Number.isSafeInteger(Number(updateData.price_paise)) ||
      Number(updateData.price_paise) < 0
    ) {
      return res.status(400).json({
        error: "Price must be a non-negative whole number in paise."
      });
    }

    updateData.price_paise = Number(updateData.price_paise);
  }

  if (Object.hasOwn(updateData, "stock_quantity")) {
    if (
      updateData.stock_quantity === "" ||
      updateData.stock_quantity === null ||
      !Number.isSafeInteger(Number(updateData.stock_quantity)) ||
      Number(updateData.stock_quantity) < 0
    ) {
      return res.status(400).json({
        error: "Stock quantity must be a non-negative whole number."
      });
    }

    updateData.stock_quantity = Number(updateData.stock_quantity);
  }

  if (
    Object.hasOwn(updateData, "active") &&
    typeof updateData.active !== "boolean"
  ) {
    return res.status(400).json({
      error: "Active must be true or false."
    });
  }

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Update product error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "This SKU already exists."
      });
    }

    return res.status(400).json({
      error: error.message
    });
  }

  if (!data) {
    return res.status(404).json({
      error: "Product not found."
    });
  }

  res.json(data);
});


 // -------------------- CARTS API --------------------

// GET all carts with customer details
app.get("/carts", async (req, res) => {
  console.log("CARTS ROUTE HIT");
  const { data, error } = await supabase
    .from("carts")
    .select("*, customers(id, name, whatsapp_number), cart_items(id, quantity, price_at_add_paise)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get carts error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// GET one cart with its items
app.get("/carts/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("carts")
    .select(`
      *,
      customers(id, name, whatsapp_number),
      cart_items(
        id,
        product_id,
        quantity,
        price_at_add_paise,
        products(id, sku, name, price_paise)
      )
    `)
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Cart not found." });
  }

  res.json(data);
});

// POST create a cart
app.post("/carts", async (req, res) => {
  const { customer_id } = req.body;

  if (typeof customer_id !== "string" || !customer_id.trim()) {
    return res.status(400).json({
      error: "Customer is required."
    });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customer_id)
    .maybeSingle();

  if (customerError) {
    return res.status(500).json({ error: customerError.message });
  }

  if (!customer) {
    return res.status(400).json({ error: "Customer not found." });
  }

  const { data, error } = await supabase
    .from("carts")
    .insert([{ customer_id, status: "active" }])
    .select()
    .single();

  if (error) {
    console.error("Create cart error:", error.message);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

 // POST add a product to a cart
app.post("/carts/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity = 1 } = req.body;

    if (
      !product_id ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return res.status(400).json({
        error: "Valid product_id and quantity are required.",
      });
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (cartError) {
      return res.status(500).json({ error: cartError.message });
    }

    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    if (cart.status !== "active") {
      return res.status(400).json({
        error: "Only active carts can have products added.",
      });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price_paise")
      .eq("id", product_id)
      .maybeSingle();

    if (productError) {
      return res.status(500).json({ error: productError.message });
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert([
        {
          cart_id: id,
          product_id,
          quantity: Number(quantity),
          price_at_add_paise: product.price_paise,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH update a cart


// PATCH update a cart
app.patch("/carts/:id", async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["active", "abandoned", "converted"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be active, abandoned, or converted."
    });
  }

  const { data, error } = await supabase
    .from("carts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Update cart error:", error.message);
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Cart not found." });
  }

  res.json(data);
});

 // POST add a product to a cart
app.post("/carts/:id/items", async (req, res) => {
  const { product_id, quantity } = req.body;
  const cartId = req.params.id;

  if (!product_id || !Number.isSafeInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      error: "A product and a positive whole-number quantity are required.",
    });
  }

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, status")
    .eq("id", cartId)
    .maybeSingle();

  if (cartError) {
    return res.status(400).json({ error: cartError.message });
  }

  if (!cart) {
    return res.status(404).json({ error: "Cart not found." });
  }

  if (cart.status !== "active") {
    return res.status(400).json({
      error: "Products can only be added to active carts.",
    });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price_paise, active")
    .eq("id", product_id)
    .maybeSingle();

  if (productError) {
    return res.status(400).json({ error: productError.message });
  }

  if (!product || !product.active) {
    return res.status(400).json({
      error: "Product not found or inactive.",
    });
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cartId,
      product_id,
      quantity,
      price_at_add_paise: product.price_paise,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
});


// PATCH update a cart item's quantity
app.patch("/carts/:id/items/:itemId", async (req, res) => {
  const { quantity } = req.body;

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      error: "Quantity must be a positive whole number.",
    });
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", req.params.itemId)
    .eq("cart_id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: "Cart item not found.",
    });
  }

  res.json(data);
});


app.get('/payments', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch payments'
    });
  }
});

/* -------------------- PAYMENTS API -------------------- */

// POST create a payment
app.post("/payments", verifyToken, async (req, res) => {
  try {
    const {
      order_id,
      amount_paise,
      status = "created",
    razorpay_payment_id,
razorpay_payment_link_id,
raw_webhook_payload,
} = req.body;

    const allowedStatuses = ["created", "paid", "failed", "refunded"];

    if (!order_id) {
      return res.status(400).json({ error: "Order ID is required." });
    }
    const { data: existingOrder, error: orderError } = await supabase
  .from("orders")
  .select("id")
  .eq("id", order_id)
  .maybeSingle();

if (orderError) {
  return res.status(500).json({
    error: orderError.message
  });
}

if (!existingOrder) {
  return res.status(400).json({
    error: "Order not found."
  });
}

    if (
      !Number.isSafeInteger(amount_paise) ||
      amount_paise <= 0
    ) {
      return res.status(400).json({
        error: "Amount must be a positive whole number in paise.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid payment status." });
    }

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id,
        amount_paise,
        status,
        razorpay_payment_id: razorpay_payment_id || null,
        razorpay_payment_link_id: razorpay_payment_link_id || null,
        raw_webhook_payload: raw_webhook_payload || null,

      })
      .select()
      .single();

    if (error) {
      console.error("Create payment error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


 // GET one payment by ID

app.patch("/payments/:id", verifyToken, async (req, res) => {
  try {
   
const {
  order_id,
  amount_paise,
  status,
  razorpay_payment_id,
  razorpay_payment_link_id,
  raw_webhook_payload,
  verified_at,
} = req.body;
    const updates = {};
   
const allowedFields = [
  "order_id",
  "amount_paise",
  "status",
  "razorpay_payment_id",
  "razorpay_payment_link_id",
  "raw_webhook_payload",
  "verified_at"
];

const requestedFields = Object.keys(req.body);

if (
  requestedFields.length === 0 ||
  requestedFields.some(field => !allowedFields.includes(field))
) {
  return res.status(400).json({
    error: "Please provide valid payment details to update."
  });
}

    const allowedStatuses = ["created", "paid", "failed", "refunded"];

  if (order_id !== undefined) {
  if (typeof order_id !== "string" || !order_id.trim()) {
    return res.status(400).json({
      error: "Valid Order ID is required."
    });
  }

  const { data: existingOrder, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", order_id)
    .maybeSingle();

  if (orderError) {
    return res.status(500).json({
      error: orderError.message
    });
  }

  if (!existingOrder) {
    return res.status(400).json({
      error: "Order not found."
    });
  }

  updates.order_id = order_id;
}

    if (amount_paise !== undefined) {
      if (
        !Number.isSafeInteger(amount_paise) ||
        amount_paise <= 0
      ) {
        return res.status(400).json({
          error: "Amount must be a positive whole number in paise.",
        });
      }
      updates.amount_paise = amount_paise;
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid payment status." });
      }
      updates.status = status;
    }

    if (razorpay_payment_id !== undefined) {
      updates.razorpay_payment_id = razorpay_payment_id || null;
    }

    if (razorpay_payment_link_id !== undefined) {
      updates.razorpay_payment_link_id = razorpay_payment_link_id || null;
    }
if (raw_webhook_payload !== undefined) {
  updates.raw_webhook_payload = raw_webhook_payload;
}

if (verified_at !== undefined) {
  updates.verified_at = verified_at;
}
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "Provide at least one field to update.",
      });
    }

    const { data, error } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Update payment error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Payment not found." });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET one payment by ID
app.get("/payments/:id", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Payment not found." });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }


});

// -------------------- ORDERS API --------------------

// CREATE a new order
app.post("/orders", async (req, res) => {
  try {
    const {
      customer_id,
      items,
      source = "manual",
      shipping_address = null,
    } = req.body;

  // Validate customer ID
if (
  typeof customer_id !== "string" ||
  !customer_id.trim()
) {
  return res.status(400).json({
    error: "Valid Customer ID is required.",
  });
}

// Check whether customer exists
const { data: existingCustomer, error: customerError } =
  await supabase
    .from("customers")
    .select("id")
    .eq("id", customer_id)
    .maybeSingle();

if (customerError) {
  return res.status(500).json({
    error: customerError.message,
  });
}

if (!existingCustomer) {
  return res.status(400).json({
    error: "Customer not found.",
  });
}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "At least one order item is required.",
      });
    }

    if (!["manual", "whatsapp_bot"].includes(source)) {
      return res.status(400).json({
        error: "Invalid order source.",
      });
    }

    // Create order and items through Supabase function
    const { data, error } = await supabase.rpc(
      "create_order_with_items",
      {
        p_customer_id: customer_id,
        p_items: items,
        p_source: source,
        p_shipping_address: shipping_address,
      }
    );

    if (error) {
      console.error("Create order error:", error.message);

      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      message: "Order created successfully.",
      order: data,
    });

  } catch (err) {
    console.error("POST /orders error:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
});

// GET all orders
app.get("/orders", async (req, res) => {
  try {
    console.log("ORDERS GET ROUTE HIT");

    const { data, error } = await supabase
      .from("orders")
     .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get orders error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// GET single order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE an order
app.patch("/orders/:id", async (req, res) => {
  try {
    console.log("PATCH ORDER ROUTE HIT");
    console.log("PATCH ORDER BODY:", req.body);
    // Validate allowed fields
const allowedFields = [
  "customer_id",
  "status",
  "source",
  "shipping_address",
  "carrier",
  "tracking_number",
  "product_id",
  "quantity"
];

const requestedFields = Object.keys(req.body);

if (
  requestedFields.length === 0 ||
  requestedFields.some(
    (field) => !allowedFields.includes(field)
  )
) {
  return res.status(400).json({
    error: "Please provide valid order details to update."
  });
}
    const {
      customer_id,
      status,
      source,

      shipping_address,
      carrier,
      tracking_number,
      product_id,
      quantity,
    } = req.body;

    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    const allowedStatuses = [
      "pending_payment",
      "paid",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    const allowedSources = ["manual", "whatsapp_bot"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    if (source !== undefined && !allowedSources.includes(source)) {
      return res.status(400).json({ error: "Invalid order source." });
    }

    const allowedTransitions = {
      pending_payment: ["paid"],
      paid: ["confirmed", "cancelled", "refunded"],
      confirmed: ["shipped"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
      refunded: [],
    };

    if (
      status !== undefined &&
      status !== existingOrder.status &&
      !allowedTransitions[existingOrder.status]?.includes(status)
    ) {
      return res.status(400).json({
        error: `Invalid status transition: ${existingOrder.status} to ${status}.`,
      });
    }

    // Validate product and quantity
    if (
      (product_id !== undefined && quantity === undefined) ||
      (product_id === undefined && quantity !== undefined)
    ) {
      return res.status(400).json({
        error: "Product and quantity must be provided together.",
      });
    }

    if (product_id !== undefined) {
      if (
        typeof product_id !== "string" ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          error: "Invalid product or quantity.",
        });
      }

      // Update product, quantity, stock and order total
    const { data: itemData, error: itemError } = await supabase.rpc(
  "update_order_with_item",
  {
    p_order_id: req.params.id,
    p_product_id: product_id,
    p_quantity: quantity,
  }
);

console.log("ORDER ITEM RPC RESULT:", {
  itemData,
  itemError,
});

if (itemError) {
  return res.status(400).json({ error: itemError.message });
}
    }
   // Update other order details
const updateData = {};
// Validate shipping fields
// Validate shipping address
if (
  shipping_address !== undefined &&
  shipping_address !== null &&
  (
    typeof shipping_address !== "object" ||
    Array.isArray(shipping_address) ||
    typeof shipping_address.address !== "string"
  )
) {
  return res.status(400).json({
    error: "Shipping address must contain a valid address."
  });
}

if (
  carrier !== undefined &&
  carrier !== null &&
  typeof carrier !== "string"
) {
  return res.status(400).json({
    error: "Carrier must be a string."
  });
}

if (
  tracking_number !== undefined &&
  tracking_number !== null &&
  typeof tracking_number !== "string"
) {
  return res.status(400).json({
    error: "Tracking number must be a string."
  });
}
// Validate customer ID
if (customer_id !== undefined) {
  if (
    typeof customer_id !== "string" ||
    !customer_id.trim()
  ) {
    return res.status(400).json({
      error: "Valid Customer ID is required.",
    });
  }

  // Check whether customer exists
  const { data: existingCustomer, error: customerError } =
    await supabase
      .from("customers")
      .select("id")
      .eq("id", customer_id)
      .maybeSingle();

  if (customerError) {
    return res.status(500).json({
      error: customerError.message,
    });
  }

  if (!existingCustomer) {
    return res.status(400).json({
      error: "Customer not found.",
    });
  }

  updateData.customer_id = customer_id;
}

if (status !== undefined) updateData.status = status;
if (source !== undefined) updateData.source = source;

if (shipping_address !== undefined) {
  updateData.shipping_address = shipping_address;
}

if (carrier !== undefined) updateData.carrier = carrier;

if (tracking_number !== undefined) {
  updateData.tracking_number = tracking_number;
}

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", req.params.id);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    }

    // Return updated order with its items
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------- UNKNOWN ROUTE --------------------

app.use((req, res) => {
  console.log("Route not found:", req.method, req.url);

  res.status(404).json({
    error: `Route not found: ${req.method} ${req.url}`
  });
});

// -------------------- START SERVER --------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log("Server file loaded completely");

setInterval(() => {
  console.log("Backend is alive");
}, 10000);
