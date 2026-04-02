import React, { useState, useEffect } from 'react';
import './App.css';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  // State Management
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Form States
  const [loginForm, setLoginForm] = useState({ registrationNumber: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', registrationNumber: '', email: '', password: '', phone: '', role: 'student' });
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    condition: 'good',
    transactionType: 'buy',
    imageUrl: '',
    schedule: '',
    isTutoring: false
  });

  // Data States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [mySales, setMySales] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  // Fetch products on view change
  useEffect(() => {
    if (currentView === 'home' || currentView === 'browse') {
      fetchProducts();
    } else if (currentView === 'dashboard' && user) {
      fetchMyListings();
      fetchMyPurchases();
      fetchMySales();
    }
  }, [currentView, user]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterCategory, filterType, priceRange, products]);

  // ==================== API CALLS ====================

  const fetchUserData = async () => {
    try {
      // User data is in token, decode it
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error('Error loading user:', error);
      logout();
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  };

  const fetchMyListings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/user/my-listings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchMyPurchases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/my-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchMySales = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/my-sales`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMySales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  // ==================== AUTH HANDLERS ====================

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Logging you in...');
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setRegisterForm({ name: '', registrationNumber: '', email: '', password: '', phone: '', role: 'student' });
        setTimeout(() => setCurrentView('home'), 1000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful!');
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoginForm({ registrationNumber: '', password: '' });
        setTimeout(() => setCurrentView('home'), 1000);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentView('home');
    setSuccess('Logged out successfully');
  };

  // ==================== PRODUCT HANDLERS ====================

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Product added successfully!');
        setProductForm({
          title: '',
          description: '',
          price: '',
          category: 'electronics',
          condition: 'good',
          transactionType: 'buy',
          imageUrl: '',
          schedule: '',
          isTutoring: false
        });
        fetchProducts();
        fetchMyListings();
        setTimeout(() => setCurrentView('dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Product deleted successfully');
        fetchProducts();
        fetchMyListings();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Network error. Please try again.');
    }
  };

  const handlePlaceOrder = async (product) => {
    if (!user) {
      setError('Please login to place an order');
      setCurrentView('login');
      return;
    }

    if (window.confirm(`Place order for "${product.title}" at ₹${product.price}?`)) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product._id })
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(data.message);
          fetchProducts();
          setSelectedProduct(null);
        } else {
          setError(data.error || 'Failed to place order');
        }
      } catch (error) {
        console.error('Error placing order:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return; // User clicked cancel

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchMyPurchases();
        fetchMySales();
        fetchProducts();
      } else {
        setError(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccess(`Order marked as ${newStatus}`);
        fetchMySales();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Network error. Please try again.');
    }
  };

  // ==================== FILTER HANDLERS ====================

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Transaction type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.transactionType === filterType);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(p => p.price <= Number(priceRange.max));
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterType('all');
    setPriceRange({ min: '', max: '' });
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      confirmed: '#00A896',
      cancelled: '#DC3545',
      completed: '#28A745'
    };
    return colors[status] || '#6C757D';
  };

  const getConditionBadge = (condition) => {
    const badges = {
      'like-new': '✨ Like New',
      'good': '👍 Good',
      'fair': '👌 Fair'
    };
    return badges[condition] || condition;
  };

  // ==================== RENDER COMPONENTS ====================

  // Alert Messages
  const renderAlerts = () => (
    <>
      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}
    </>
  );

  // Navigation Bar
  const renderNavbar = () => (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setCurrentView('home')}>
        <span className="logo">🎓</span>
        <span className="brand-name">Smart Campus Marketplace</span>
      </div>
      
      <div className="nav-menu">
        <button 
          className={currentView === 'home' ? 'nav-link active' : 'nav-link'}
          onClick={() => setCurrentView('home')}
        >
          Home
        </button>
        <button 
          className={currentView === 'browse' ? 'nav-link active' : 'nav-link'}
          onClick={() => setCurrentView('browse')}
        >
          Browse
        </button>
        
        {user ? (
          <>
            <button 
              className={currentView === 'add-product' ? 'nav-link active' : 'nav-link'}
              onClick={() => setCurrentView('add-product')}
            >
              Sell Item
            </button>
            <button 
              className={currentView === 'dashboard' ? 'nav-link active' : 'nav-link'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
            <div className="nav-user">
              <span className="user-name">👤 {user.name}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <button 
              className={currentView === 'login' ? 'nav-link active' : 'nav-link'}
              onClick={() => setCurrentView('login')}
            >
              Login
            </button>
            <button 
              className="btn-register"
              onClick={() => setCurrentView('register')}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );

  // Home Page
  const renderHome = () => (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Smart Campus Marketplace</h1>
        <p className="hero-subtitle">Buy, Sell, Rent & Borrow within your campus community</p>
        <div className="hero-stats">
          <div className="stat-card">
            <h3>{products.length}</h3>
            <p>Active Listings</p>
          </div>
          <div className="stat-card">
            <h3>{products.filter(p => p.transactionType === 'rent').length}</h3>
            <p>Rentals Available</p>
          </div>
          <div className="stat-card">
            <h3>{products.filter(p => p.transactionType === 'borrow').length}</h3>
            <p>Free to Borrow</p>
          </div>
        </div>
        <button className="btn-primary btn-large" onClick={() => setCurrentView('browse')}>
          Start Browsing →
        </button>
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🛍️</span>
            <h3>Buy</h3>
            <p>Purchase items at great prices from fellow students</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>Sell</h3>
            <p>List your items and earn money easily</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔄</span>
            <h3>Rent</h3>
            <p>Rent items you need temporarily</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤝</span>
            <h3>Borrow</h3>
            <p>Borrow items for free from generous peers</p>
          </div>
        </div>
      </div>

      <div className="categories-section">
        <h2>Popular Categories</h2>
        <div className="category-grid">
          {['Electronics', 'Books', 'Furniture', 'Sports', 'Stationery', 'Others'].map(cat => (
            <div 
              key={cat}
              className="category-card"
              onClick={() => {
                setFilterCategory(cat.toLowerCase());
                setCurrentView('browse');
              }}
            >
              <span className="category-icon">
                {cat === 'Electronics' && '💻'}
                {cat === 'Books' && '📚'}
                {cat === 'Furniture' && '🪑'}
                {cat === 'Sports' && '⚽'}
                {cat === 'Stationery' && '✏️'}
                {cat === 'Others' && '🎯'}
              </span>
              <h4>{cat}</h4>
              <p>{products.filter(p => p.category === cat.toLowerCase()).length} items</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Browse Products
  const renderBrowse = () => (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse Products</h1>
        <p>Discover amazing deals from your campus community</p>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <input
            type="text"
            className="search-bar"
            placeholder="🔍 Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="furniture">Furniture</option>
            <option value="sports">Sports</option>
            <option value="stationery">Stationery</option>
            <option value="others">Others</option>
          </select>

          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
            <option value="borrow">To Borrow</option>
            <option value="service">Tutoring Service</option>
          </select>

          <input
            type="number"
            className="filter-input"
            placeholder="Min ₹"
            value={priceRange.min}
            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
          />

          <input
            type="number"
            className="filter-input"
            placeholder="Max ₹"
            value={priceRange.max}
            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
          />

          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="products-count">
        Showing {filteredProducts.length} products
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} />
                ) : (
                  <div className="no-image">
                    {product.category === 'electronics' && '💻'}
                    {product.category === 'books' && '📚'}
                    {product.category === 'furniture' && '🪑'}
                    {product.category === 'sports' && '⚽'}
                    {product.category === 'stationery' && '✏️'}
                    {product.category === 'others' && '🎯'}
                  </div>
                )}
                <span className={`badge-type type-${product.transactionType}`}>
                  {product.transactionType === 'buy' && '💰 For Sale'}
                  {product.transactionType === 'rent' && '🔄 For Rent'}
                  {product.transactionType === 'borrow' && '🤝 To Borrow'}
                  {product.transactionType === 'service' && '📚 Tutoring'}
                </span>
              </div>
              
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="product-description">{product.description.substring(0, 100)}...</p>
                
                <div className="product-meta">
                  <span className="badge-condition">{getConditionBadge(product.condition)}</span>
                  <span className="badge-category">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </span>
                </div>

                <div className="product-footer">
                  <div className="price-section">
                    <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.transactionType === 'rent' && <span className="price-unit">/day</span>}
                    {product.transactionType === 'service' && <span className="price-unit">/session</span>}
                    {product.transactionType === 'borrow' && <span className="free-badge">FREE</span>}
                  </div>
                  
                  <button 
                    className="btn-view"
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentView('product-detail');
                    }}
                  >
                    View Details
                  </button>
                </div>

                <div className="seller-info">
                  <span>👤 {product.sellerName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Product Detail View
  const renderProductDetail = () => {
    if (!selectedProduct) return null;

    return (
      <div className="product-detail-page">
        <button className="btn-back" onClick={() => setCurrentView('browse')}>
          ← Back to Browse
        </button>

        <div className="product-detail-container">
          <div className="product-detail-image">
            {selectedProduct.imageUrl ? (
              <img src={selectedProduct.imageUrl} alt={selectedProduct.title} />
            ) : (
              <div className="no-image-large">
                {selectedProduct.category === 'electronics' && '💻'}
                {selectedProduct.category === 'books' && '📚'}
                {selectedProduct.category === 'furniture' && '🪑'}
                {selectedProduct.category === 'sports' && '⚽'}
                {selectedProduct.category === 'stationery' && '✏️'}
                {selectedProduct.category === 'others' && '🎯'}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <h1>{selectedProduct.title}</h1>
            
            <div className="detail-badges">
              <span className={`badge-type type-${selectedProduct.transactionType}`}>
                {selectedProduct.transactionType === 'buy' && '💰 For Sale'}
                {selectedProduct.transactionType === 'rent' && '🔄 For Rent'}
                {selectedProduct.transactionType === 'borrow' && '🤝 To Borrow'}
                {selectedProduct.transactionType === 'service' && '📚 Tutoring'}
              </span>
            </div>

            <div className="price-large">
              ₹{selectedProduct.price.toLocaleString('en-IN')}
              {selectedProduct.transactionType === 'rent' && <span className="price-unit">/day</span>}
              {selectedProduct.transactionType === 'service' && <span className="price-unit">/session</span>}
              {selectedProduct.transactionType === 'borrow' && <span className="free-badge">FREE</span>}
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{selectedProduct.description}</p>
            </div>

            {selectedProduct.schedule && (
              <div className="description-section">
                <h3>Schedule</h3>
                <p>{selectedProduct.schedule}</p>
              </div>
            )}

            <div className="seller-section">
              <h3>Seller Information</h3>
              <p><strong>Name:</strong> {selectedProduct.sellerName}</p>
              <p><strong>Email:</strong> {selectedProduct.sellerEmail}</p>
              <p><strong>Listed:</strong> {formatDate(selectedProduct.createdAt)}</p>
            </div>

            <div className="action-buttons">
              {user && user.id !== selectedProduct.sellerId && !selectedProduct.isSold && (
                <button 
                  className="btn-primary btn-large"
                  onClick={() => handlePlaceOrder(selectedProduct)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 
                    selectedProduct.transactionType === 'buy' ? '🛒 Buy Now' :
                    selectedProduct.transactionType === 'rent' ? '🔄 Rent This' :
                    '🤝 Request to Borrow'
                  }
                </button>
              )}

              {!user && (
                <button 
                  className="btn-primary btn-large"
                  onClick={() => setCurrentView('login')}
                >
                  Login to Place Order
                </button>
              )}

              {selectedProduct.isSold && (
                <div className="sold-badge-large">
                  ⚠️ This item is no longer available
                </div>
              )}

              {user && user.id === selectedProduct.sellerId && (
                <div className="own-product-notice">
                  ℹ️ This is your listing
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Login Page
  const renderLogin = () => (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login to Your Account</h2>
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Registration Number</label>
            <input
              type="text"
              required
              value={loginForm.registrationNumber}
              onChange={(e) => setLoginForm({...loginForm, registrationNumber: e.target.value})}
              placeholder="Enter your registration number"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? 
          <button onClick={() => setCurrentView('register')}>Register here</button>
        </p>
      </div>
    </div>
  );

  // Register Page
  const renderRegister = () => (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={registerForm.name}
              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select
              value={registerForm.role}
              onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div className="form-group">
            <label>{registerForm.role === 'teacher' ? 'Employee ID' : 'Registration Number'}</label>
            <input
              type="text"
              required
              value={registerForm.registrationNumber}
              onChange={(e) => setRegisterForm({...registerForm, registrationNumber: e.target.value})}
              placeholder={registerForm.role === 'teacher' ? 'Enter your employee ID' : 'Enter your registration number'}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              required
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength="6"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              placeholder="Minimum 6 characters"
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? 
          <button onClick={() => setCurrentView('login')}>Login here</button>
        </p>
      </div>
    </div>
  );

  // Add Product Page
  const renderAddProduct = () => (
    <div className="add-product-page">
      <div className="form-container">
        <h2>List Your Item</h2>
        <form onSubmit={handleAddProduct} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                placeholder="e.g., iPhone 13 - Excellent Condition"
              />
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={productForm.price}
                onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                placeholder="e.g., 45000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              required
              rows="4"
              value={productForm.description}
              onChange={(e) => setProductForm({...productForm, description: e.target.value})}
              placeholder="Provide detailed information about your item..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({...productForm, category: e.target.value})}
              >
                <option value="electronics">Electronics</option>
                <option value="books">Books</option>
                <option value="furniture">Furniture</option>
                <option value="sports">Sports</option>
                <option value="stationery">Stationery</option>
                <option value="services">Services</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select
                value={productForm.condition}
                onChange={(e) => setProductForm({...productForm, condition: e.target.value})}
              >
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            {user?.role === 'teacher' && (
              <div className="form-group">
                <label>Offer Tutoring Service?</label>
                <input
                  type="checkbox"
                  checked={productForm.isTutoring}
                  onChange={(e) => {
                    const isTutoring = e.target.checked;
                    setProductForm({
                      ...productForm,
                      isTutoring,
                      transactionType: isTutoring ? 'service' : 'buy',
                      category: isTutoring ? 'services' : productForm.category,
                      schedule: isTutoring ? productForm.schedule : ''
                    });
                  }}
                />
              </div>
            )}

            <div className="form-group">
              <label>Transaction Type *</label>
              <select
                value={productForm.transactionType}
                onChange={(e) => setProductForm({...productForm, transactionType: e.target.value})}
              >
                <option value="buy">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="borrow">To Borrow (Free)</option>
                <option value="service">Tutoring Service</option>
              </select>
            </div>
          </div>

          {productForm.isTutoring && (
            <div className="form-group">
              <label>Schedule / Timings *</label>
              <input
                type="text"
                required
                value={productForm.schedule}
                onChange={(e) => setProductForm({...productForm, schedule: e.target.value})}
                placeholder="e.g. Mon/Wed 5-7pm, Sat 10-12pm"
              />
            </div>
          )}

          <div className="form-group">
            <label>Image URL (optional)</label>
            <input
              type="url"
              value={productForm.imageUrl}
              onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Listing...' : 'List Product'}
          </button>
        </form>
      </div>
    </div>
  );

  // Dashboard
  const renderDashboard = () => (
    <div className="dashboard-page">
      <h1>My Dashboard</h1>

      <div className="dashboard-tabs">
        <button className="tab-btn active">My Listings ({myListings.length})</button>
        <button className="tab-btn">My Purchases ({myPurchases.length})</button>
        <button className="tab-btn">My Sales ({mySales.length})</button>
      </div>

      <div className="dashboard-section">
        <h2>My Listings</h2>
        {myListings.length === 0 ? (
          <div className="empty-state">
            <p>You haven't listed any products yet</p>
            <button className="btn-primary" onClick={() => setCurrentView('add-product')}>
              List Your First Item
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {myListings.map(product => (
              <div key={product._id} className="listing-card">
                <div className="listing-header">
                  <h3>{product.title}</h3>
                  <span className={product.isSold ? 'status-sold' : 'status-active'}>
                    {product.isSold ? '🔴 Sold' : '🟢 Active'}
                  </span>
                </div>
                <p className="listing-price">₹{product.price.toLocaleString('en-IN')}</p>
                <p className="listing-meta">
                  {product.category} • {product.condition} • {formatDate(product.createdAt)}
                </p>
                <div className="listing-actions">
                  <button className="btn-danger" onClick={() => handleDeleteProduct(product._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>My Purchases</h2>
        {myPurchases.length === 0 ? (
          <div className="empty-state">
            <p>You haven't made any purchases yet</p>
            <button className="btn-primary" onClick={() => setCurrentView('browse')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {myPurchases.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>{order.productTitle}</h3>
                    <p className="order-seller">Seller: {order.sellerName}</p>
                  </div>
                  <span 
                    className="order-status"
                    style={{backgroundColor: getStatusColor(order.status)}}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="order-details">
                  <p><strong>Price:</strong> ₹{order.productPrice.toLocaleString('en-IN')}</p>
                  <p><strong>Type:</strong> {order.transactionType}</p>
                  <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                  {order.status === 'cancelled' && (
                    <p className="cancel-info">
                      <strong>Cancelled by:</strong> {order.cancelledBy}<br/>
                      <strong>Reason:</strong> {order.cancellationReason}
                    </p>
                  )}
                </div>
                {order.status === 'pending' && (
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={loading}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>My Sales</h2>
        {mySales.length === 0 ? (
          <div className="empty-state">
            <p>No one has purchased your items yet</p>
          </div>
        ) : (
          <div className="orders-list">
            {mySales.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>{order.productTitle}</h3>
                    <p className="order-buyer">Buyer: {order.buyerName}</p>
                    <p className="order-buyer">Contact: {order.buyerEmail} • {order.buyerPhone}</p>
                  </div>
                  <span 
                    className="order-status"
                    style={{backgroundColor: getStatusColor(order.status)}}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="order-details">
                  <p><strong>Price:</strong> ₹{order.productPrice.toLocaleString('en-IN')}</p>
                  <p><strong>Type:</strong> {order.transactionType}</p>
                  <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                  {order.status === 'cancelled' && (
                    <p className="cancel-info">
                      <strong>Cancelled by:</strong> {order.cancelledBy}<br/>
                      <strong>Reason:</strong> {order.cancellationReason}
                    </p>
                  )}
                </div>
                {order.status === 'pending' && (
                  <div className="order-actions">
                    <button 
                      className="btn-success"
                      onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                    >
                      Confirm Order
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={loading}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <button 
                    className="btn-primary"
                    onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="App">
      {renderNavbar()}
      {renderAlerts()}
      
      <main className="main-content">
        {currentView === 'home' && renderHome()}
        {currentView === 'browse' && renderBrowse()}
        {currentView === 'product-detail' && renderProductDetail()}
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
        {currentView === 'add-product' && renderAddProduct()}
        {currentView === 'dashboard' && renderDashboard()}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Smart Campus Marketplace. Built for VIT Students.</p>
      </footer>
    </div>
  );
}

export default App;