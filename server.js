const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-marketplace';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['student', 'professor'], required: true },
  department: String,
  studentId: String,
  employeeId: String,
  phoneNumber: String,
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['textbooks', 'electronics', 'stationery', 'lab-equipment', 'furniture', 'clothing', 'services', 'other'],
    required: true 
  },
  condition: { 
    type: String, 
    enum: ['new', 'like-new', 'good', 'fair'],
    default: 'good'
  },
  images: [String],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerType: String,
  location: String,
  availableFor: { 
    type: String, 
    enum: ['sale', 'rent', 'borrow'],
    default: 'sale'
  },
  tags: [String],
  views: { type: Number, default: 0 },
  isSold: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  meetupLocation: String,
  meetupTime: Date,
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'card'],
    default: 'cash'
  },
  createdAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Message = mongoose.model('Message', messageSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'campus-marketplace-secret-key-change-in-production';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, userType, department, studentId, employeeId, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      userType,
      department,
      studentId,
      employeeId,
      phoneNumber
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, userType: user.userType }, JWT_SECRET);

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, userType: user.userType }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, userType: user.userType }, JWT_SECRET);

    res.json({ 
      token,
      user: { id: user._id, name: user.name, email: user.email, userType: user.userType }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRODUCT ROUTES ====================

// Get all products with filters
app.get('/api/products', async (req, res) => {
  try {
    const { category, condition, availableFor, search, minPrice, maxPrice } = req.query;
    
    let query = { isSold: false };
    
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (availableFor) query.availableFor = availableFor;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(query)
      .populate('seller', 'name userType department')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email userType department phoneNumber');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (Protected)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, category, condition, images, location, availableFor, tags } = req.body;

    const user = await User.findById(req.user.userId);

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      images,
      location,
      availableFor,
      tags,
      seller: req.user.userId,
      sellerType: user.userType
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (Protected)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (Protected)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's products (Protected)
app.get('/api/my-products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER ROUTES ====================

// Create order (Protected)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { productId, meetupLocation, meetupTime, paymentMethod } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isSold) {
      return res.status(400).json({ error: 'Product not available' });
    }

    const order = new Order({
      buyer: req.user.userId,
      seller: product.seller,
      product: productId,
      totalAmount: product.price,
      meetupLocation,
      meetupTime,
      paymentMethod
    });

    await order.save();

    product.isSold = true;
    await product.save();

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders (Protected)
app.get('/api/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.userId })
      .populate('product')
      .populate('seller', 'name email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's sales (Protected)
app.get('/api/my-sales', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.userId })
      .populate('product')
      .populate('buyer', 'name email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (Protected)
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.seller.toString() !== req.user.userId && order.buyer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    order.status = req.body.status;
    await order.save();

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGE ROUTES ====================

// Send message (Protected)
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, productId, message } = req.body;

    const newMessage = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      product: productId,
      message
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversations (Protected)
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { receiver: req.user.userId }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .populate('product', 'title')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ROUTES ====================

// Get dashboard stats (Protected)
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ seller: req.user.userId });
    const activeProducts = await Product.countDocuments({ seller: req.user.userId, isSold: false });
    const soldProducts = await Product.countDocuments({ seller: req.user.userId, isSold: true });
    const totalOrders = await Order.countDocuments({ buyer: req.user.userId });
    const totalSales = await Order.countDocuments({ seller: req.user.userId });

    res.json({
      totalProducts,
      activeProducts,
      soldProducts,
      totalOrders,
      totalSales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Campus Marketplace API - MERN Stack' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
