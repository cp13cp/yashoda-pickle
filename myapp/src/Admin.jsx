import { useEffect, useState } from "react";
import { buildUrl } from "./api";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userFetchError, setUserFetchError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is admin (you can customize this logic)
    // For now, checking if email is in admin list or has admin role
    // TO ADD ADMIN USERS: Add their email to the adminEmails array below
    const adminEmails = ["admin@yashodapickle.com", "admin@example.com", "your-email@example.com", "singhchandrapal13@gmail.com"]; // Add your admin emails here
    const isAdmin = adminEmails.includes(user.email) || user.user_metadata?.role === "admin";

    if (!isAdmin) {
      alert("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setUser(user);
    fetchData();
  };

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase.from("pickle").select("*");
      setProducts(productsData || []);

      // Fetch users from the backend admin endpoint
      const userResponse = await fetch(buildUrl("/admin/users"));
      if (userResponse.ok) {
        const usersData = await userResponse.json();
        setUsers(usersData || []);
      } else {
        const errorText = await userResponse.text();
        console.error("Unable to fetch users", errorText);
        setUserFetchError(errorText || "Unable to fetch admin users.");
        setUsers([]);
      }

      // Fetch orders from the backend admin endpoint
      const orderResponse = await fetch(buildUrl("/admin/orders"));
      if (orderResponse.ok) {
        const ordersData = await orderResponse.json();
        setOrders(ordersData || []);
      } else {
        const errorText = await orderResponse.text();
        console.error("Unable to fetch orders", errorText);
        setOrders([]);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product) => {
    try {
      const response = await fetch(buildUrl("/admin/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      const data = await response.json();
      setProducts([...products, data]);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product: " + error.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(buildUrl(`/admin/products/${id}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== id));
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product: " + error.message);
    }
  };

  const editProduct = async (id, updatedProduct) => {
    try {
      const response = await fetch(buildUrl(`/admin/products/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      const data = await response.json();
      setProducts(products.map((p) => (p.id === id ? data : p)));
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product: " + error.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(buildUrl(`/admin/orders/${orderId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      const updatedOrder = await response.json();
      setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeTab === "dashboard" ? "bg-orange-500 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeTab === "products" ? "bg-orange-500 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  🥒 Products
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeTab === "orders" ? "bg-orange-500 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  📦 Orders
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeTab === "users" ? "bg-orange-500 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  👥 Users
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === "dashboard" && <DashboardTab products={products} users={users} orders={orders} />}
              {activeTab === "products" && <ProductsTab products={products} addProduct={addProduct} deleteProduct={deleteProduct} editProduct={editProduct} />}
              {activeTab === "orders" && <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} />}
              {activeTab === "users" && <UsersTab users={users} error={userFetchError} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ products, users, orders }) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const completedOrders = orders.filter(order => order.status === "completed").length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-sm text-blue-800">Total Products</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{users.length}</div>
          <div className="text-sm text-green-800">Total Users</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
          <div className="text-sm text-purple-800">Total Orders</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">₹{totalRevenue}</div>
          <div className="text-sm text-orange-800">Total Revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between p-3 bg-slate-50 rounded">
                <span>Order #{order.id}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-2">
            {products.slice(0, 5).map(product => (
              <div key={product.id} className="flex justify-between p-3 bg-slate-50 rounded">
                <span>{product.name}</span>
                <span>₹{product.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ products, addProduct, deleteProduct, editProduct }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "" });
  const [editProductData, setEditProductData] = useState({ name: "", price: "", image: "" });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      alert("Please fill all fields");
      return;
    }
    addProduct(newProduct);
    setNewProduct({ name: "", price: "", image: "" });
    setShowAddForm(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.id);
    setEditProductData({
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  const handleUpdateProduct = () => {
    if (!editProductData.name || !editProductData.price || !editProductData.image) {
      alert("Please fill all fields");
      return;
    }
    editProduct(editingProduct, editProductData);
    setEditingProduct(null);
    setEditProductData({ name: "", price: "", image: "" });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditProductData({ name: "", price: "", image: "" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          {showAddForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newProduct.image}
              onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
              className="px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleAddProduct}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Add Product
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4">
            {editingProduct === product.id ? (
              // Edit Form
              <div>
                <h3 className="font-semibold mb-2">Edit Product</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={editProductData.name}
                    onChange={(e) => setEditProductData({...editProductData, name: e.target.value})}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={editProductData.price}
                    onChange={(e) => setEditProductData({...editProductData, price: e.target.value})}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={editProductData.image}
                    onChange={(e) => setEditProductData({...editProductData, image: e.target.value})}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdateProduct}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Product Display
              <>
                <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded mb-2" />
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-orange-600 font-bold">₹{product.price}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ orders, updateOrderStatus }) {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border border-blue-300",
    shipped: "bg-purple-100 text-purple-800 border border-purple-300",
    delivered: "bg-green-100 text-green-800 border border-green-300",
    cancelled: "bg-red-100 text-red-800 border border-red-300",
    paid: "bg-green-100 text-green-800 border border-green-300",
  };

  const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-slate-200 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                <p className="text-sm text-slate-600">
                  {order.user_name} • ₹{order.total} • {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status] || statusColors.pending}`}>
                  {order.status}
                </span>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded transition"
                >
                  {expandedOrder === order.id ? "▼" : "▶"}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Delivery Address</p>
                    <p className="text-sm text-slate-900">{order.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Payment Method</p>
                    <p className="text-sm text-slate-900 capitalize">
                      {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
                    </p>
                  </div>
                </div>

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Items</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-slate-700">
                          {item.quantity}x {item.name} @ ₹{item.price}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Change */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (confirm(`Change order status to "${status}"?`)) {
                            updateOrderStatus(order.id, status);
                            setExpandedOrder(null);
                          }
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          order.status === status
                            ? "bg-slate-700 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, error }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2">ID</th>
              <th className="border border-slate-300 px-4 py-2">Name</th>
              <th className="border border-slate-300 px-4 py-2">Email</th>
              <th className="border border-slate-300 px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                  No users found. Confirm that your Supabase service role env vars are set and the admin endpoint is reachable.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="border border-slate-300 px-4 py-2">{user.id}</td>
                  <td className="border border-slate-300 px-4 py-2">{user.name}</td>
                  <td className="border border-slate-300 px-4 py-2">{user.email}</td>
                  <td className="border border-slate-300 px-4 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}