
import { useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

const API_URL = "http://localhost:5000";



function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [activePage, setActivePage] = useState("Customers");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
const [carts, setCarts] = useState([]);
// Payments
const [payments, setPayments] = useState([]);
const [orders, setOrders] = useState([]);
// Orders
const [showOrderForm, setShowOrderForm] = useState(false);
const [orderEditingId, setOrderEditingId] = useState(null);
const [orderCustomerId, setOrderCustomerId] = useState("");
const [orderStatus, setOrderStatus] = useState("pending_payment");
const [orderProductId, setOrderProductId] = useState("");
const [orderQuantity, setOrderQuantity] = useState("1");
const [orderSource, setOrderSource] = useState("manual");
const [orderTotal, setOrderTotal] = useState("");
const [shippingAddress, setShippingAddress] = useState("");
const [carrier, setCarrier] = useState("");
const [trackingNumber, setTrackingNumber] = useState("");
const [orderFilter, setOrderFilter] = useState("all");
const [showPaymentForm, setShowPaymentForm] = useState(false);
const [paymentEditingId, setPaymentEditingId] = useState(null);

const [paymentOrderId, setPaymentOrderId] = useState("");
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentStatus, setPaymentStatus] = useState("created");
const [razorpayPaymentId, setRazorpayPaymentId] = useState("");
const [razorpayLinkId, setRazorpayLinkId] = useState("");
const [addingProductToCart, setAddingProductToCart] = useState(false);
const [selectedCustomerId, setSelectedCustomerId] = useState("");
const [creatingCart, setCreatingCart] = useState(false);
const [cartMessage, setCartMessage] = useState("");
const [showCartForm, setShowCartForm] = useState(false);
const [cartFilter, setCartFilter] = useState("all");
const [editingCartId, setEditingCartId] = useState(null);
const [editingCartStatus, setEditingCartStatus] = useState("active");
const [selectedCartProductByCart, setSelectedCartProductByCart] = useState({});
const [cartQuantityByCart, setCartQuantityByCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [customerEditingId, setCustomerEditingId] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [sku, setSku] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);
  const [productEditingId, setProductEditingId] = useState(null);
const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apiRequest = async (path, options = {}) => {
    const { data, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw new Error(sessionError.message);

    const token = data.session?.access_token;
    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    let response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new Error(
        "Cannot connect to backend. Check whether port 5000 is running."
      );
    }

    const text = await response.text();
    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { error: text };
    }

    if (!response.ok) {
      throw new Error(result.error || `Request failed: ${response.status}`);
    }

    return result;
  };

  const loadCustomers = async () => {
    const data = await apiRequest("/customers");
    if (!Array.isArray(data)) {
      throw new Error("Customers API did not return a list.");
    }
    setCustomers(data);
  };

  const loadProducts = async () => {
    const data = await apiRequest("/products");
    if (!Array.isArray(data)) {
      throw new Error("Products API did not return a list.");
    }
    setProducts(data);
  };
const loadCarts = async () => {
  const data = await apiRequest("/carts");

  if (!Array.isArray(data)) {
    throw new Error("Carts API did not return a list.");
  }

  setCarts(data);
};
const loadPayments = async () => {
  const data = await apiRequest("/payments");

  if (!Array.isArray(data)) {
    throw new Error("Payments API did not return a list.");
  }

  setPayments(data);
  setError("");
};

const resetPaymentForm = () => {
  setPaymentOrderId("");
  setPaymentAmount("");
  setPaymentStatus("created");
  setRazorpayPaymentId("");
  setRazorpayLinkId("");
  setPaymentEditingId(null);
};




const loadOrders = async () => {
  const data = await apiRequest("/orders");

  if (!Array.isArray(data)) {
    throw new Error("Orders API did not return a list.");
  }

  setOrders(data);
};
const resetOrderForm = () => {
  setOrderCustomerId("");
  setOrderStatus("pending_payment");
  setOrderSource("manual");
  setOrderTotal("");
  setShippingAddress("");
  setCarrier("");
  setTrackingNumber("");
  setOrderProductId("");
  setOrderQuantity("1");
  setOrderEditingId(null);
};

const handleOrderSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  if (!orderCustomerId) {
    setError("Please select a customer.");
    return;
  }

  // New order validation
  if (!orderEditingId) {
    if (!orderProductId) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(Number(orderQuantity)) ||
      Number(orderQuantity) <= 0
    ) {
      setError("Please enter a valid quantity.");
      return;
    }
  }

  // Edit order validation
  if (
    orderEditingId &&
    (
      orderTotal === "" ||
      !Number.isFinite(Number(orderTotal)) ||
      Number(orderTotal) < 0
    )
  ) {
    setError("Please enter a valid order amount.");
    return;
  }

  setLoading(true);

  try {
    const shippingData = shippingAddress.trim()
      ? { address: shippingAddress.trim() }
      : null;

  
if (orderEditingId) {
  const orderData = {
    customer_id: orderCustomerId,
    status: orderStatus,
    source: orderSource,
    product_id: orderProductId,
    quantity: Number(orderQuantity),
    shipping_address: shippingData,
    carrier: carrier.trim() || null,
    tracking_number: trackingNumber.trim() || null,
  };

  console.log("EDIT ORDER SUBMIT:", orderData);

  await apiRequest(`/orders/${orderEditingId}`, {
    method: "PATCH",
    body: JSON.stringify(orderData),
  });

  setMessage("Order updated successfully.");
} else {
  const orderData = {
    customer_id: orderCustomerId,
    items: [
      {
        product_id: orderProductId,
        quantity: Number(orderQuantity),
      },
    ],
    source: orderSource,
    shipping_address: shippingData,
  };

  await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

  setMessage("Order created successfully.");
}


    resetOrderForm();
    setShowOrderForm(false);
    await loadOrders();
    await loadPayments();

  } catch (err) {
    setError(err.message || "Unable to save order.");
  } finally {
    setLoading(false);
  }
};
const handleOrderEdit = async (order) => {
  setError("");
  setMessage("");
  setLoading(true);

  try {
    const [latestOrder] = await Promise.all([
      apiRequest(`/orders/${order.id}`),
      loadProducts(),
    ]);

    setOrderEditingId(latestOrder.id);
    setOrderCustomerId(latestOrder.customer_id || "");
    setOrderStatus(latestOrder.status || "pending_payment");
    setOrderSource(latestOrder.source || "manual");

    setOrderTotal(
      (Number(latestOrder.total_amount_paise || 0) / 100).toFixed(2)
    );

    setShippingAddress(
      latestOrder.shipping_address?.address || ""
    );

    setCarrier(latestOrder.carrier || "");
    setTrackingNumber(latestOrder.tracking_number || "");

    const firstItem = latestOrder.order_items?.[0];

    setOrderProductId(firstItem?.product_id || "");
    setOrderQuantity(String(firstItem?.quantity || 1));

    setShowOrderForm(true);
  } catch (err) {
    setError(err.message || "Unable to load order.");
  } finally {
    setLoading(false);
  }
};
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  try {
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) throw loginError;

    if (!data.session?.access_token) {
      throw new Error("Access token is missing.");
    }

    setUser(data.user);
    setPassword("");
    setActivePage("Customers");

    try {
      await loadCustomers();
      await loadOrders();
    } catch (loadError) {
      setError(loadError.message || "Unable to load customers.");
    }
  } catch (err) {
    setError(err.message || "Unable to log in.");
  } finally {
    setLoading(false);
  }
};

  const resetCustomerForm = () => {
    setCustomerName("");
    setWhatsappNumber("");
    setCustomerEditingId(null);
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = {
        name: customerName.trim() || null,
        whatsapp_number: whatsappNumber.trim(),
      };

      if (!data.whatsapp_number) {
        throw new Error("WhatsApp number is required.");
      }

      if (customerEditingId) {
        await apiRequest(`/customers/${customerEditingId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        setMessage("Customer updated successfully.");
      } else {
        await apiRequest("/customers", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setMessage("Customer added successfully.");
      }

      resetCustomerForm();
      await loadCustomers();

    } catch (err) {
      setError(err.message || "Unable to save customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerEdit = async (id) => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const customer = await apiRequest(`/customers/${id}`);
      setCustomerName(customer.name || "");
      setWhatsappNumber(customer.whatsapp_number || "");
      setCustomerEditingId(customer.id);
    } catch (err) {
      setError(err.message || "Unable to load customer.");
    } finally {
      setLoading(false);
    }
  };

 

 const resetProductForm = () => {
  setSku("");
  setProductName("");
  setDescription("");
  setCategory("");
  setPrice("");
  setStock("");
  setActive(true);
  setProductEditingId(null);
  setShowProductForm(false);
};
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!sku.trim() || !productName.trim()) {
        throw new Error("SKU and product name are required.");
      }

      if (price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
        throw new Error("Enter a valid price.");
      }

      if (
        stock === "" ||
        !Number.isSafeInteger(Number(stock)) ||
        Number(stock) < 0
      ) {
        throw new Error("Stock must be a non-negative whole number.");
      }

      const data = {
        sku: sku.trim(),
        name: productName.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        price_paise: Math.round(Number(price) * 100),
        stock_quantity: Number(stock),
        active,
      };

      if (productEditingId) {
        await apiRequest(`/products/${productEditingId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        setMessage("Product updated successfully.");
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setMessage("Product added successfully.");
      }

      resetProductForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductEdit = async (id) => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const product = await apiRequest(`/products/${id}`);

      setSku(product.sku || "");
      setProductName(product.name || "");
      setDescription(product.description || "");
      setCategory(product.category || "");
      setPrice((Number(product.price_paise) / 100).toFixed(2));
      setStock(String(product.stock_quantity ?? 0));
      setActive(product.active ?? true);
      setProductEditingId(product.id);
      setShowProductForm(true);
    } catch (err) {
      setError(err.message || "Unable to load product.");
    } finally {
      setLoading(false);
    }
  };
const handleCreateCart = async (e) => {
  e.preventDefault();

  setCartMessage("");
  setError("");

  if (!selectedCustomerId) {
    setCartMessage("Please select a customer.");
    return;
  }

  setCreatingCart(true);

  try {
    await apiRequest("/carts", {
      method: "POST",
      body: JSON.stringify({
        customer_id: selectedCustomerId,
      }),
    });

    setCartMessage("Cart created successfully!");

    setSelectedCustomerId("");
    setShowCartForm(false);

    await loadCarts();
  } catch (err) {
    setCartMessage(
      err.message || "Unable to create cart."
    );
  } finally {
    setCreatingCart(false);
  }
};

const handleAddProductToCart = async (cartId, productId, quantity) => {
  setCartMessage("");
  setError("");

  if (!productId) {
    setCartMessage("Please select a product.");
    return;
  }

  const parsedQuantity = Number(quantity);

  if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
    setCartMessage("Please enter a valid quantity.");
    return;
  }

  setAddingProductToCart(true);

  try {
    await apiRequest(`/carts/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        quantity: parsedQuantity,
      }),
    });

    await loadCarts();
    setCartMessage("Product added to cart successfully!");
  } catch (err) {
    setCartMessage(
      err.message || "Unable to add product to cart."
    );
  } finally {
    setAddingProductToCart(false);
  }
};

const handleCartStatusUpdate = async (cartId) => {
  setCartMessage("");
  setError("");
  setLoading(true);

  try {
    await apiRequest(`/carts/${cartId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: editingCartStatus
      })
    });

    setCartMessage("Cart status updated successfully.");
    setEditingCartId(null);

    await loadCarts();

  } catch (err) {
    setCartMessage(
      err.message || "Unable to update cart status."
    );
  } finally {
    setLoading(false);
  }
};


const handlePaymentSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  if (!paymentOrderId) {
    setError("Please select an order.");
    return;
  }

  if (
    paymentAmount === "" ||
    !Number.isFinite(Number(paymentAmount)) ||
    Number(paymentAmount) < 0
  ) {
    setError("Please enter a valid payment amount.");
    return;
  }

  setLoading(true);

  try {
    const paymentData = {
      order_id: paymentOrderId,
      amount_paise: Math.round(Number(paymentAmount) * 100),
      status: paymentStatus,
      razorpay_payment_id: razorpayPaymentId.trim() || null,
      razorpay_payment_link_id: razorpayLinkId.trim() || null,
    };

    if (paymentEditingId) {
      await apiRequest(`/payments/${paymentEditingId}`, {
        method: "PATCH",
        body: JSON.stringify(paymentData),
      });
      setMessage("Payment updated successfully.");
    } else {
      await apiRequest("/payments", {
        method: "POST",
        body: JSON.stringify(paymentData),
      });
      setMessage("Payment created successfully.");
    }

    resetPaymentForm();
    setShowPaymentForm(false);
    await loadPayments();
  } catch (err) {
    setError(err.message || "Unable to save payment.");
  } finally {
    setLoading(false);
  }
};

const handlePaymentEdit = async (id) => {
  setError("");
  setMessage("");
  setLoading(true);

  try {
    const payment = await apiRequest(`/payments/${id}`);

    setPaymentOrderId(payment.order_id || "");
    setPaymentAmount(
      (Number(payment.amount_paise || 0) / 100).toFixed(2)
    );
    setPaymentStatus(payment.status || "created");
    setRazorpayPaymentId(payment.razorpay_payment_id || "");
    setRazorpayLinkId(payment.razorpay_payment_link_id || "");
    setPaymentEditingId(payment.id);
    setShowPaymentForm(true);
  } catch (err) {
    setError(err.message || "Unable to load payment.");
  } finally {
    setLoading(false);
  }
};

  const changePage = async (page) => {
    setActivePage(page);
    setError("");
    setMessage("");
    resetCustomerForm();
    resetProductForm();

  if (
      page === "Orders" ||

  page === "Customers" ||
  page === "Products" ||
  page === "Carts" ||
  page === "Payments"
) {
      setLoading(true);
      try {
        if (page === "Orders") await loadOrders();
        if (page === "Customers") await loadCustomers();
        if (page === "Customers") await loadOrders();
        if (page === "Products") await loadProducts();
        if (page === "Carts") await loadCarts();
        if (page === "Carts") await loadProducts();
        if (page === "Payments") await loadPayments();
if (page === "Payments") await loadOrders();
      } catch (err) {
        setError(err.message || `Unable to load ${page.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmail("");
    setPassword("");
    setCustomers([]);
    setProducts([]);
    resetCustomerForm();
    resetProductForm();
    setError("");
    setMessage("");
  };

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="brand-mark">C</div>
          <h1>CareConnect</h1>
          <p className="muted">Customer Care Management</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button full-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div>
            <h2>CareConnect</h2>
            <span>CUSTOMER CARE</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="sidebar-nav">
          {[
            { name: "Orders", icon: "▤" },
            { name: "Customers", icon: "♙" },
            { name: "Products", icon: "▣" },
            { name: "Carts", icon: "🛒" },
            { name: "Payments", icon: "₹" },
          ].map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? "selected" : ""}`}
              onClick={() => changePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {activePage === item.name && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
          
          <div className="user-info">
            <strong>{user.email}</strong>
            <span>Signed in</span>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            ↪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">CareConnect / </span>
            <strong>{activePage}</strong>
          </div>
          <div className="topbar-user">
            <span className="online-dot" />
            {user.email}
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUSTOMER CARE MANAGEMENT</p>
              <h1>{activePage}</h1>
              <p className="muted">
                Manage your {activePage.toLowerCase()} in one place.
              </p>
            </div>
          </div>

          {error && <div className="alert error-message">{error}</div>}
          {message && <div className="alert success-message">{message}</div>}

          {activePage === "Customers" && (
            <>
              {(showCustomerForm || customerEditingId) && (
  <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{customerEditingId ? "Edit Customer" : "Add Customer"}</h2>
                    <p>Add customer contact details below.</p>
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleCustomerSubmit}>
                  <div className="field">

                    <label htmlFor="customerName">Customer Name</label>
                    <input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="whatsappNumber">WhatsApp Number *</label>
                    <input
                      id="whatsappNumber"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Enter WhatsApp number"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" disabled={loading}>
                   {loading
  ? orderEditingId
    ? "Updating..."
    : "Creating..."
  : orderEditingId
    ? "Update Order"
    : "Create Order"}
                    </button>
                   
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        resetCustomerForm();
                        setShowCustomerForm(false);
                        setError("");
                        setMessage("");
                      }}
                    >
                      Cancel
                    </button>

                  </div>
                </form>
              </section>
              )}
              <section className="panel">
              
<div className="panel-heading">
  <div>
    
    <h2>Customers</h2>
    <p>{customers.length} customer record(s)</p>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <button
      type="button"
      className="primary-button"
      onClick={() => {
        resetCustomerForm();
        setError("");
        setMessage("");
        setShowCustomerForm(true);
      }}
    >
      + Add Customer
    </button>

    <span className="count-badge">
      {customers.length} total
    </span>
  </div>
</div>


                {customers.length === 0 ? (
                  <p className="empty-state">No customer records found.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>



                          <th>Name</th>
<th>WhatsApp Number</th>
<th>Orders</th>
<th>Added</th>
<th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>
                              <div className="table-person">
                                <span className="table-avatar">
                                  {(customer.name || "C").charAt(0).toUpperCase()}
                                </span>
                                <strong>{customer.name || "Name not provided"}</strong>
                              </div>
                            </td>
                            <td>{customer.whatsapp_number}</td>

<td>
  {orders.filter(
    (order) => order.customer_id === customer.id
  ).length}
</td>

<td>
  {customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "—"}
</td>

<td>
  <button
    className="text-button"
    onClick={() => handleCustomerEdit(customer.id)}
    disabled={loading}
  >
    Edit
  </button>



</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "Products" && (
            <>
              {(showProductForm || productEditingId) && (
  <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{productEditingId ? "Edit Product" : "Add Product"}</h2>
                    <p>Enter product details. Price is entered in rupees.</p>
                  </div>
                </div>

                <form className="form-grid product-form" onSubmit={handleProductSubmit}>
                  <div className="field">
                    <label htmlFor="sku">SKU *</label>
                    <input
                      id="sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. PROD-001"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="productName">Product Name *</label>
                    <input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="category">Category</label>
                    <input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter category"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="price">Price (₹) *</label>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="stock">Stock Quantity *</label>
                    <input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="description">Description</label>
                    <input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Product description"
                    />
                  </div>

                  <div className="field checkbox-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                      />
                      Product is active
                    </label>
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" disabled={loading}>
                      {loading
                        ? "Please wait..."
                        : productEditingId
                          ? "Save Changes"
                          : "Add Product"}
                    </button>
                   
{!productEditingId && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      resetProductForm();
      setShowProductForm(false);
      setError("");
      setMessage("");
    }}
  >
    Cancel
  </button>
)}
{productEditingId && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      resetProductForm();
      setError("");
      setMessage("");
    }}
  >
    Cancel
  </button>
)}

                  </div>
                </form>
              </section>
              )}
             <section className="panel">
  
<div className="panel-heading">
  <div>
    <h2>Products</h2>
    <p>{products.length} product record(s)</p>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <button
      type="button"
      className="primary-button"
      onClick={() => setShowProductForm(true)}
    >
      + Add Product
    </button>

    <span className="count-badge">
      {products.length} total
    </span>
  </div>
</div>


                {products.length === 0 ? (
                  <p className="empty-state">
                    No products found. Add your first product above.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.sku}</td>
                            <td>
                              <strong>{product.name}</strong>
                              {product.description && (
                                <small className="table-description">
                                  {product.description}
                                </small>
                              )}
                            </td>
                            <td>{product.category || "—"}</td>
                            <td>
                              ₹{(Number(product.price_paise) / 100).toFixed(2)}
                            </td>
                            <td>{product.stock_quantity}</td>
                            <td>
                              <span className={`status-pill ${product.active ? "active" : "inactive"}`}>
                                {product.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="text-button"
                                onClick={() => handleProductEdit(product.id)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

         


{activePage === "Carts" && (
  <section className="panel">
    <div className="panel-heading">
      <div>
        <h2>Carts</h2>
       <p className="cart-summary">
  {carts.filter((cart) => cart.status === "active").length} active
  {" · "}
  {carts.filter((cart) => {
    if (cart.status !== "abandoned" || !cart.updated_at) {
      return false;
    }

    const updatedTime = new Date(cart.updated_at).getTime();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

    return updatedTime >= last24Hours && updatedTime <= Date.now();
  }).length} abandoned in the last 24 hours
</p>
      </div>

      
{!showCartForm && (
  <button
    className="primary-button"
    onClick={() => {
      setShowCartForm(true);
      setCartMessage("");
    }}
  >
    + Add cart
  </button>
)}

    </div>

   {showCartForm && (
 
<form
  className="cart-create-form"
  onSubmit={handleCreateCart}
>

    <div className="field cart-customer-field">
      <label htmlFor="cart-customer">Select Customer</label>

      <select
        id="cart-customer"
        value={selectedCustomerId}
        onChange={(e) =>
          setSelectedCustomerId(e.target.value)
        }
        required
      >
        <option value="">Choose a customer</option>

        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name || "Unnamed customer"} —{" "}
            {customer.whatsapp_number}
          </option>
        ))}
      </select>
    </div>

    <div className="cart-form-actions">
      <button
        className="primary-button"
        type="submit"
        disabled={creatingCart}
      >
        {creatingCart ? "Creating..." : "Create Cart"}
      </button>

      <button
        className="secondary-button"
        type="button"
        onClick={() => {
          setShowCartForm(false);
          setSelectedCustomerId("");
        }}
      >
        Cancel
      </button>
    </div>
  </form>
)}

    {cartMessage && <p>{cartMessage}</p>}

    <div className="cart-filters">
      {["all", "active", "abandoned", "converted"].map(
        (status) => (
          <button
            key={status}
            className={
              cartFilter === status
                ? "cart-filter selected"
                : "cart-filter"
            }
            onClick={() => setCartFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        )
      )}

      <button
        className="secondary-button"
        onClick={async () => {
          try {
            setLoading(true);
            await loadCarts();
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        Refresh
      </button>
    </div>

    {loading ? (
      <p className="empty-state">Loading carts...</p>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Items</th>
              <th>Cart Value</th>
              <th>Status</th>
              <th>Edit</th>
              <th>Add Product</th>
            </tr>
          </thead>

          <tbody>
            {carts
              .filter(
                (cart) =>
                  cartFilter === "all" ||
                  cart.status === cartFilter
              )
              .map((cart) => {
                const items = cart.cart_items || [];
                const itemCount = items.reduce(
                  (total, item) =>
                    total + Number(item.quantity || 0),
                  0
                );
                const totalPaise = items.reduce(
                  (total, item) =>
                    total +
                    Number(item.quantity || 0) *
                      Number(item.price_at_add_paise || 0),
                  0
                );

                return (
                  <tr key={cart.id}>
                    <td>
                      {cart.customers?.name ||
                        "Name not provided"}
                    </td>

                    <td>{itemCount}</td>

                    <td>
                      ₹{(totalPaise / 100).toFixed(2)}
                    </td>

                    <td>
                      {editingCartId === cart.id ? (
             <select
  value={editingCartStatus}
  onChange={(e) => setEditingCartStatus(e.target.value)}
>
                          <option value="active">Active</option>
                          <option value="abandoned">Abandoned</option>
                          <option value="converted">Converted</option>
                        </select>
                      ) : (
                        <span
                          className={`status-pill ${cart.status}`}
                        >
                          {cart.status}
                        </span>
                      )}
                    </td>

                    <td>
                      {editingCartId === cart.id ? (
                        <>
                          <button
                            className="text-button"
                            onClick={() =>
                              handleCartStatusUpdate(cart.id)
                            }
                          >
                            Save
                          </button>

                          <button
                            className="text-button"
                            onClick={() => setEditingCartId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditingCartId(cart.id);
                            setEditingCartStatus(cart.status);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                    <td>
  <div className="cart-item-controls">
  <select
  value={selectedCartProductByCart[cart.id] || ""}
  onChange={(e) =>
    setSelectedCartProductByCart((prev) => ({
      ...prev,
      [cart.id]: e.target.value,
    }))
  }

>
      <option value="">Select product</option>

      {products
        .filter((product) => product.active)
        .map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} — ₹
            {(Number(product.price_paise) / 100).toFixed(2)}
          </option>
        ))}
    </select>

    <input
  type="number"
  min="1"
  value={cartQuantityByCart[cart.id] ?? 1}
  onChange={(e) =>
    setCartQuantityByCart((prev) => ({
      ...prev,
      [cart.id]: e.target.value,
    }))
  }
/>

    <button
      type="button"
      className="primary-button"
      disabled={addingProductToCart}
    onClick={async () => {
  const productId = selectedCartProductByCart[cart.id] || "";
  const quantity = cartQuantityByCart[cart.id] ?? 1;

  await handleAddProductToCart(
    cart.id,
    productId,
    quantity
  );

  setSelectedCartProductByCart((prev) => ({
    ...prev,
    [cart.id]: "",
  }));

  setCartQuantityByCart((prev) => ({
    ...prev,
    [cart.id]: 1,
  }));
}}
    >
      {addingProductToCart ? "Adding..." : "Add"}
    </button>
  </div>
</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {carts.filter(
          (cart) =>
            cartFilter === "all" ||
            cart.status === cartFilter
        ).length === 0 && (
          <p className="empty-state">No carts found.</p>
        )}
      </div>
    )}
  </section>
)}


{activePage === "Payments" && (
  <>
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>
            {paymentEditingId ? "Edit Payment" : "Payments Management"}
          </h2>
          <p>Create and manage payment records.</p>
        </div>

        <button
  type="button"
  className="primary-button"
  onClick={() => {
    if (showPaymentForm) {
      resetPaymentForm();
      setShowPaymentForm(false);
    } else {
      resetPaymentForm();
      setShowPaymentForm(true);
    }

    setError("");
    setMessage("");
  }}
>
  {showPaymentForm ? "Cancel" : "+ Add Payment"}
</button>
      </div>

      {showPaymentForm && (
        <form className="form-grid" onSubmit={handlePaymentSubmit}>
          <div className="field">
            <label>Select Order *</label>
            <select
              value={paymentOrderId}
              onChange={(e) => setPaymentOrderId(e.target.value)}
              required
            >
              <option value="">Choose an order</option>

              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number || order.id}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="field">
            <label>Payment Status *</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="created">Created</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="field">
            <label>Razorpay Payment ID</label>
            <input
              value={razorpayPaymentId}
              onChange={(e) => setRazorpayPaymentId(e.target.value)}
              placeholder="Enter payment ID"
            />
          </div>

          <div className="field">
            <label>Razorpay Payment Link ID</label>
            <input
              value={razorpayLinkId}
              onChange={(e) => setRazorpayLinkId(e.target.value)}
              placeholder="Enter payment link ID"
            />
          </div>

          <div className="form-actions">
            <button className="primary-button" disabled={loading}>
              {loading
                ? "Saving..."
                : paymentEditingId
                  ? "Update Payment"
                  : "Create Payment"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                resetPaymentForm();
                setShowPaymentForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>

    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Payment Records</h2>
          <p>{payments.length} payment record(s)</p>
        </div>

        <button
          className="secondary-button"
          onClick={async () => {
            try {
              setLoading(true);
              await loadPayments();
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="empty-state">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="empty-state">No payment records found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.order_id}</td>

                  <td>
                    ₹{(Number(payment.amount_paise) / 100).toFixed(2)}
                  </td>

                <td>{payment.id || "—"}</td>

                  <td>
                    <span className={`status-pill ${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>

                  <td>
                    {payment.created_at
                      ? new Date(payment.created_at).toLocaleDateString("en-IN")
                      : "—"}
                  </td>

                  <td>
                    <button
                      className="text-button"
                      onClick={() => handlePaymentEdit(payment.id)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>
)}


{activePage === "Orders" && (
  <section className="panel">
   
<div className="panel-heading">
  <div>
    <h2>Orders</h2>
    <p>Manage your orders in one place.</p>
  </div>

  <button
    type="button"
    className="primary-button"
    disabled={loading}
    onClick={async () => {
      resetOrderForm();
      setError("");
      setMessage("");
      setLoading(true);

      try {
        await Promise.all([
          loadCustomers(),
          loadProducts(),
        ]);

        setShowOrderForm(true);
      } catch (err) {
        setError(err.message || "Unable to load order form.");
      } finally {
        setLoading(false);
      }
    }}
  >
    + Add Order
  </button>
</div>


    {/* Order Status Filters */}
    <div className="orders-filters">
      {[
        { label: "All", value: "all" },
        { label: "Pending Payment", value: "pending_payment" },
        { label: "Paid", value: "paid" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ].map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={
            orderFilter === filter.value
              ? "filter-chip active"
              : "filter-chip"
          }
          onClick={() => setOrderFilter(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>

    {/* Orders Table */}
    <div className="orders-table-heading">
      <div>
        <h3>Order Records</h3>
        <p>
          {orders.filter(
            (order) =>
              orderFilter === "all" ||
              order.status === orderFilter
          ).length} order(s)
        </p>
      </div>
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Source</th>
            <th>Status</th>
            <th>Edit</th>
          </tr>
        </thead>

        <tbody>
          {orders.filter(
            (order) =>
              orderFilter === "all" ||
              order.status === orderFilter
          ).length === 0 ? (
            <tr>
              <td colSpan="7" className="orders-empty">
                No orders found.
              </td>
            </tr>
          ) : (
            orders
              .filter(
                (order) =>
                  orderFilter === "all" ||
                  order.status === orderFilter
              )
              .map((order) => (
                <tr key={order.id}>
                  <td>
                    #{order.id.slice(0, 8)}
                  </td>

                  <td>
                    {customers.find(
                      (customer) =>
                        customer.id === order.customer_id
                    )?.name || "—"}
                  </td>

                  <td>
                    {order.order_items?.length ?? 0}
                  </td>

                  <td>
                    ₹
                    {(
                      Number(order.total_amount_paise || 0) / 100
                    ).toFixed(2)}
                  </td>

                  <td>
                    {order.source === "whatsapp_bot"
                      ? "WhatsApp Bot"
                      : "Manual"}
                  </td>

                  <td>
                    <span
                      className={`status-pill ${order.status}`}
                    >
                      {order.status?.replaceAll("_", " ") || "—"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => handleOrderEdit(order)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>

    {/* Edit Order Form */}
    {showOrderForm && (
      <div className="orders-form-card">
        <div className="panel-heading">
          <h3>{orderEditingId ? "Edit Order" : "Add Order"}</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              resetOrderForm();
              setShowOrderForm(false);
            }}
          >
            Cancel
          </button>
        </div>

        <form className="form-grid" onSubmit={handleOrderSubmit}>
          <div className="field">
            <label>Customer</label>
            <select
              value={orderCustomerId}
              onChange={(e) => setOrderCustomerId(e.target.value)}
              required
            >
              <option value="">Choose customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
  <label>Product</label>
  <select
    value={orderProductId}
    onChange={(e) => setOrderProductId(e.target.value)}
    required
  >
    <option value="">Choose product</option>
    {products.map((product) => (
      <option key={product.id} value={product.id}>
        {product.name}
      </option>
    ))}
  </select>
</div>

<div className="field">
  <label>Quantity</label>
  <input
    type="number"
    min="1"
    step="1"
    value={orderQuantity}
    onChange={(e) => setOrderQuantity(e.target.value)}
    required
  />
</div>

          <div className="field">
            <label>Order Status</label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="field">
            <label>Order Source</label>
            <select
              value={orderSource}
              onChange={(e) => setOrderSource(e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="whatsapp_bot">WhatsApp Bot</option>
            </select>
          </div>

          <div className="field">
            <label>Shipping Address</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </div>
          <div className="field">
  <label>Carrier</label>
  <input
    type="text"
    value={carrier}
    onChange={(e) => setCarrier(e.target.value)}
    placeholder="e.g. Blue Dart"
  />
</div>

<div className="field">
  <label>Tracking Number</label>
  <input
    type="text"
    value={trackingNumber}
    onChange={(e) => setTrackingNumber(e.target.value)}
    placeholder="Enter tracking number"
  />
</div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
            {loading
  ? "Please wait..."
  : orderEditingId
    ? "Update Order"
    : "Create Order"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                resetOrderForm();
                setShowOrderForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}

  </section>
)}

        </section>
      </main>
    </div>
  );
}

export default App;
