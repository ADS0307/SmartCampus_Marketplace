import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    availableFor: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
      fetchOrders();
      fetchSales();
      fetchStats();
    }
  }, [user]);

  const redirectToLogin = () => {
    alert('Please login to continue.');
    setCurrentPage('login');
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setCurrentPage('login');
      }
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const data = await apiCall(`/products?${params.toString()}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const data = await apiCall('/my-products');
      setMyProducts(data);
    } catch (error) {
      console.error('Error fetching my products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await apiCall('/my-orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const data = await apiCall('/my-sales');
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiCall('/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRegister = async (formData) => {
    try {
      const data = await apiCall('/auth/register', 'POST', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setCurrentPage('home');
      alert('Registration successful!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async (formData) => {
    try {
      const data = await apiCall('/auth/login', 'POST', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setCurrentPage('home');
      alert('Login successful!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  const handleCreateProduct = async (formData) => {
    try {
      await apiCall('/products', 'POST', formData);
      fetchProducts();
      fetchMyProducts();
      setCurrentPage('myProducts');
      alert('Product listed successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiCall(`/products/${productId}`, 'DELETE');
        fetchProducts();
        fetchMyProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handlePlaceOrder = async (productId, orderDetails) => {
    if (!user) {
      redirectToLogin();
      return;
    }

    try {
      await apiCall('/orders', 'POST', { productId, ...orderDetails });
      fetchProducts();
      fetchOrders();
      setSelectedProduct(null);
      alert('Order placed successfully! Check your orders page.');
    } catch (error) {
      alert(error.message);
    }
  };

  const Navigation = () => (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="logo" onClick={() => setCurrentPage('home')}>
          🎓 Campus Marketplace
        </h1>
        <div className="nav-links">
          <button onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'active' : ''}>
            Home
          </button>
          {user ? (
            <>
              <button onClick={() => setCurrentPage('myProducts')} className={currentPage === 'myProducts' ? 'active' : ''}>
                My Listings
              </button>
              <button onClick={() => setCurrentPage('addProduct')} className={currentPage === 'addProduct' ? 'active' : ''}>
                Sell Item
              </button>
              <button onClick={() => setCurrentPage('orders')} className={currentPage === 'orders' ? 'active' : ''}>
                My Orders
              </button>
              <button onClick={() => setCurrentPage('sales')} className={currentPage === 'sales' ? 'active' : ''}>
                My Sales
              </button>
              <button onClick={() => setCurrentPage('dashboard')} className={currentPage === 'dashboard' ? 'active' : ''}>
                Dashboard
              </button>
              <div className="user-info">
                <span>👤 {user.name} ({user.userType})</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentPage('login')}>Login</button>
              <button onClick={() => setCurrentPage('register')} className="register-btn">Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  const FilterBar = () => (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search products..."
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        className="search-input"
      />
      <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
        <option value="">All Categories</option>
        <option value="textbooks">Textbooks</option>
        <option value="electronics">Electronics</option>
        <option value="stationery">Stationery</option>
        <option value="lab-equipment">Lab Equipment</option>
        <option value="furniture">Furniture</option>
        <option value="clothing">Clothing</option>
        <option value="services">Services</option>
        <option value="other">Other</option>
      </select>
      <select value={filters.condition} onChange={(e) => setFilters({ ...filters, condition: e.target.value })}>
        <option value="">All Conditions</option>
        <option value="new">New</option>
        <option value="like-new">Like New</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
      </select>
      <select value={filters.availableFor} onChange={(e) => setFilters({ ...filters, availableFor: e.target.value })}>
        <option value="">Buy/Rent/Borrow</option>
        <option value="sale">For Sale</option>
        <option value="rent">For Rent</option>
        <option value="borrow">For Borrow</option>
      </select>
      <input
        type="number"
        placeholder="Min Price"
        value={filters.minPrice}
        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
        className="price-input"
      />
      <input
        type="number"
        placeholder="Max Price"
        value={filters.maxPrice}
        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
        className="price-input"
      />
      <button onClick={() => setFilters({ search: '', category: '', condition: '', availableFor: '', minPrice: '', maxPrice: '' })}>
        Clear Filters
      </button>
    </div>
  );

  const ProductCard = ({ product, showActions = false, onDelete = null }) => (
    <div className="product-card">
      <div className="product-image">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.title} />
        ) : (
          <div className="no-image">📦</div>
        )}
        <span className={`badge badge-${product.availableFor}`}>
          {product.availableFor === 'sale' ? 'For Sale' : product.availableFor === 'rent' ? 'For Rent' : 'For Borrow'}
        </span>
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-description">{product.description.substring(0, 100)}...</p>
        <div className="product-meta">
          <span className="price">₹{product.price}</span>
          <span className="condition">{product.condition}</span>
        </div>
        <div className="product-details">
          <p>📂 {product.category}</p>
          <p>📍 {product.location || 'Campus'}</p>
          <p>👤 {product.seller?.name} ({product.seller?.userType})</p>
          <p>👁️ {product.views} views</p>
        </div>
        {!showActions ? (
          <button onClick={() => setSelectedProduct(product)} className="view-btn">
            View Details
          </button>
        ) : (
          <div className="product-actions">
            <button onClick={() => onDelete(product._id)} className="delete-btn">Delete</button>
          </div>
        )}
      </div>
    </div>
  );

  const HomePage = () => (
    <div className="page">
      <div className="hero">
        <h2>VIT Campus Marketplace</h2>
        <p>Buy, Sell, and Exchange within the campus community</p>
      </div>
      <FilterBar />
      <div className="products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <div className="no-products">
            <p>No products found. Be the first to list something!</p>
          </div>
        )}
      </div>
    </div>
  );

  const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    return (
      <div className="page">
        <div className="auth-container">
          <h2>Login</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(formData); }}>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button type="submit">Login</button>
          </form>
          <p>
            Don't have an account? <span onClick={() => setCurrentPage('register')} className="link">Register here</span>
          </p>
        </div>
      </div>
    );
  };

  const RegisterPage = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      userType: 'student',
      department: '',
      studentId: '',
      employeeId: '',
      phoneNumber: ''
    });

    return (
      <div className="page">
        <div className="auth-container">
          <h2>Register</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(formData); }}>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <select value={formData.userType} onChange={(e) => setFormData({ ...formData, userType: e.target.value })} required>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
            <input
              type="text"
              placeholder="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            {formData.userType === 'student' ? (
              <input
                type="text"
                placeholder="Registration Number"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            ) : (
              <input
                type="text"
                placeholder="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            )}
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <button type="submit">Register</button>
          </form>
          <p>
            Already have an account? <span onClick={() => setCurrentPage('login')} className="link">Login here</span>
          </p>
        </div>
      </div>
    );
  };

  const AddProductPage = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      price: '',
      category: 'textbooks',
      condition: 'good',
      location: '',
      availableFor: 'sale',
      tags: '',
      images: ''
    });

    return (
      <div className="page">
        <div className="form-container">
          <h2>List a New Item</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const productData = {
              ...formData,
              price: parseFloat(formData.price),
              tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
              images: formData.images.split(',').map(i => i.trim()).filter(i => i)
            };
            handleCreateProduct(productData);
          }}>
            <input
              type="text"
              placeholder="Product Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="4"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
              <option value="textbooks">Textbooks</option>
              <option value="electronics">Electronics</option>
              <option value="stationery">Stationery</option>
              <option value="lab-equipment">Lab Equipment</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
            <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} required>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            <select value={formData.availableFor} onChange={(e) => setFormData({ ...formData, availableFor: e.target.value })} required>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
              <option value="borrow">For Borrow</option>
            </select>
            <input
              type="text"
              placeholder="Location (Building/Room)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
            <input
              type="text"
              placeholder="Image URLs (comma-separated)"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
            />
            <button type="submit">List Product</button>
          </form>
        </div>
      </div>
    );
  };

  const MyProductsPage = () => (
    <div className="page">
      <h2>My Listings</h2>
      <div className="products-grid">
        {myProducts.length > 0 ? (
          myProducts.map(product => (
            <ProductCard key={product._id} product={product} showActions={true} onDelete={handleDeleteProduct} />
          ))
        ) : (
          <div className="no-products">
            <p>You haven't listed any products yet.</p>
            <button onClick={() => setCurrentPage('addProduct')}>List Your First Item</button>
          </div>
        )}
      </div>
    </div>
  );

  const OrdersPage = () => (
    <div className="page">
      <h2>My Orders</h2>
      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order._id} className="order-card">
              <h3>{order.product?.title}</h3>
              <p>Seller: {order.seller?.name} ({order.seller?.email})</p>
              <p>Amount: ₹{order.totalAmount}</p>
              <p>Status: <span className={`status status-${order.status}`}>{order.status}</span></p>
              <p>Meetup: {order.meetupLocation} at {new Date(order.meetupTime).toLocaleString()}</p>
              <p>Payment: {order.paymentMethod}</p>
              <p>Contact: {order.seller?.phoneNumber}</p>
            </div>
          ))
        ) : (
          <p>No orders yet.</p>
        )}
      </div>
    </div>
  );

  const SalesPage = () => (
    <div className="page">
      <h2>My Sales</h2>
      <div className="orders-list">
        {sales.length > 0 ? (
          sales.map(order => (
            <div key={order._id} className="order-card">
              <h3>{order.product?.title}</h3>
              <p>Buyer: {order.buyer?.name} ({order.buyer?.email})</p>
              <p>Amount: ₹{order.totalAmount}</p>
              <p>Status: <span className={`status status-${order.status}`}>{order.status}</span></p>
              <p>Meetup: {order.meetupLocation} at {new Date(order.meetupTime).toLocaleString()}</p>
              <p>Payment: {order.paymentMethod}</p>
              <p>Contact: {order.buyer?.phoneNumber}</p>
            </div>
          ))
        ) : (
          <p>No sales yet.</p>
        )}
      </div>
    </div>
  );

  const DashboardPage = () => (
    <div className="page">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Listings</h3>
          <p className="stat-number">{stats.totalProducts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Listings</h3>
          <p className="stat-number">{stats.activeProducts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Sold Items</h3>
          <p className="stat-number">{stats.soldProducts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.totalOrders || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Sales</h3>
          <p className="stat-number">{stats.totalSales || 0}</p>
        </div>
      </div>
    </div>
  );

  const ProductDetailModal = () => {
    const [orderDetails, setOrderDetails] = useState({
      meetupLocation: '',
      meetupTime: '',
      paymentMethod: 'cash'
    });

    if (!selectedProduct) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedProduct(null)}>×</button>
          <h2>{selectedProduct.title}</h2>
          <div className="product-detail">
            <div className="detail-images">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                selectedProduct.images.map((img, idx) => (
                  <img key={idx} src={img} alt={selectedProduct.title} />
                ))
              ) : (
                <div className="no-image-large">📦</div>
              )}
            </div>
            <div className="detail-info">
              <p className="detail-price">₹{selectedProduct.price}</p>
              <p className="detail-description">{selectedProduct.description}</p>
              <div className="detail-meta">
                <p><strong>Category:</strong> {selectedProduct.category}</p>
                <p><strong>Condition:</strong> {selectedProduct.condition}</p>
                <p><strong>Available For:</strong> {selectedProduct.availableFor}</p>
                <p><strong>Location:</strong> {selectedProduct.location || 'Campus'}</p>
                <p><strong>Seller:</strong> {selectedProduct.seller?.name} ({selectedProduct.seller?.userType})</p>
                <p><strong>Department:</strong> {selectedProduct.seller?.department}</p>
                <p><strong>Contact:</strong> {selectedProduct.seller?.email}</p>
                {selectedProduct.seller?.phoneNumber && (
                  <p><strong>Phone:</strong> {selectedProduct.seller?.phoneNumber}</p>
                )}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <p><strong>Tags:</strong> {selectedProduct.tags.join(', ')}</p>
                )}
              </div>
              {!user ? (
                <div className="login-prompt">
                  <p>Please login to place an order for this item.</p>
                  <button onClick={() => setCurrentPage('login')}>Login</button>
                </div>
              ) : user.id !== selectedProduct.seller?._id ? (
                <div className="order-form">
                  <h3>Place Order</h3>
                  <input
                    type="text"
                    placeholder="Meetup Location"
                    value={orderDetails.meetupLocation}
                    onChange={(e) => setOrderDetails({ ...orderDetails, meetupLocation: e.target.value })}
                    required
                  />
                  <input
                    type="datetime-local"
                    value={orderDetails.meetupTime}
                    onChange={(e) => setOrderDetails({ ...orderDetails, meetupTime: e.target.value })}
                    required
                  />
                  <select value={orderDetails.paymentMethod} onChange={(e) => setOrderDetails({ ...orderDetails, paymentMethod: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                  <button onClick={() => handlePlaceOrder(selectedProduct._id, orderDetails)}>
                    Place Order
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <Navigation />
      <div className="container">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'register' && <RegisterPage />}
        {currentPage === 'addProduct' && user && <AddProductPage />}
        {currentPage === 'myProducts' && user && <MyProductsPage />}
        {currentPage === 'orders' && user && <OrdersPage />}
        {currentPage === 'sales' && user && <SalesPage />}
        {currentPage === 'dashboard' && user && <DashboardPage />}
      </div>
      <ProductDetailModal />
    </div>
  );
}

export default App;
