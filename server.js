// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ==================== MONGODB SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  transactionType: { type: String, required: true }, // buy, rent, borrow
  imageUrl: { type: String, default: '' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String, required: true },
  sellerEmail: { type: String, required: true },
  isSold: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true },
  productPrice: { type: Number, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending' 
  },
  transactionType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  cancelledBy: { type: String }, // 'buyer' or 'seller'
  cancellationReason: { type: String }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productTitle: { type: String },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== MIDDLEWARE ====================

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ==================== ROUTES ====================

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Campus Marketplace API',
    status: 'Running',
    version: '1.0.0'
  });
});

// ========== AUTHENTICATION ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, registrationNumber, email, password, phone } = req.body;

    // Validation
    if (!name || !registrationNumber || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists by email or registration number
    const existingUser = await User.findOne({
      $or: [
        { email },
        { registrationNumber }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or registration number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      registrationNumber,
      email,
      password: hashedPassword,
      phone
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, registrationNumber: user.registrationNumber, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        registrationNumber: user.registrationNumber,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { registrationNumber, password } = req.body;

    // Validation
    if (!registrationNumber || !password) {
      return res.status(400).json({ error: 'Registration number and password are required' });
    }

    // Find user by registration number
    const user = await User.findOne({ registrationNumber });
    if (!user) {
      return res.status(400).json({ error: 'Invalid registration number or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid registration number or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, registrationNumber: user.registrationNumber, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        registrationNumber: user.registrationNumber,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ========== PRODUCT ROUTES ==========

// Get all products (with filters)
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, transactionType, minPrice, maxPrice } = req.query;
    
    let query = { isSold: false };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (transactionType && transactionType !== 'all') {
      query.transactionType = transactionType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Add product (protected)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, category, condition, transactionType, imageUrl } = req.body;

    // Validation
    if (!title || !description || !price || !category || !condition || !transactionType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      transactionType,
      imageUrl: imageUrl || '',
      sellerId: req.user.id,
      sellerName: req.user.name,
      sellerEmail: req.user.email
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product (protected)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own products' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (protected)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get user's products (protected)
app.get('/api/products/user/my-listings', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ error: 'Failed to fetch your products' });
  }
});

// ========== ORDER ROUTES ==========

// Place order (protected)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.isSold) {
      return res.status(400).json({ error: 'This product is no longer available' });
    }

    // Can't buy your own product
    if (product.sellerId.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot buy your own product' });
    }

    // Get buyer details
    const buyer = await User.findById(req.user.id);

    const order = new Order({
      productId: product._id,
      productTitle: product.title,
      productPrice: product.price,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      buyerId: req.user.id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      buyerPhone: buyer.phone,
      transactionType: product.transactionType,
      status: 'pending'
    });

    await order.save();

    // Mark product as sold
    product.isSold = true;
    await product.save();

    res.status(201).json({ 
      message: 'Order placed successfully! The seller will contact you soon.', 
      order 
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get user's orders as buyer (protected)
app.get('/api/orders/my-purchases', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch your purchases' });
  }
});

// Get user's orders as seller (protected)
app.get('/api/orders/my-sales', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch your sales' });
  }
});

// Update order status (protected)
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only seller can update order status
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can update order status' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (protected) - NEW FEATURE
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is already cancelled or completed
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed order' });
    }

    // Determine who is cancelling (buyer or seller)
    let cancelledBy;
    if (order.buyerId.toString() === req.user.id) {
      cancelledBy = 'buyer';
    } else if (order.sellerId.toString() === req.user.id) {
      cancelledBy = 'seller';
    } else {
      return res.status(403).json({ error: 'You are not authorized to cancel this order' });
    }

    // Update order
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancellationReason = reason || 'No reason provided';
    await order.save();

    // Make product available again
    const product = await Product.findById(order.productId);
    if (product) {
      product.isSold = false;
      await product.save();
    }

    res.json({ 
      message: 'Order cancelled successfully. The product is now available again.', 
      order 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ========== MESSAGE ROUTES ==========

// Send message (protected)
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, productId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    let productTitle = null;
    if (productId) {
      const product = await Product.findById(productId);
      productTitle = product ? product.title : null;
    }

    const newMessage = new Message({
      senderId: req.user.id,
      senderName: req.user.name,
      receiverId,
      receiverName: receiver.name,
      productId: productId || null,
      productTitle,
      message
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user's messages (protected)
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read (protected)
app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only mark your own messages as read' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ==================== DATABASE CONNECTION ====================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log('📦 Database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API ready at http://localhost:${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('💤 MongoDB connection closed');
    process.exit(0);
  });
});
