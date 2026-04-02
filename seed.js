require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import your models (same schemas as in server.js)
const userSchema = new mongoose.Schema({
  name: String,
  registrationNumber: { type: String, required: true, unique: true },
  email: String,
  password: String,
  phone: String,
  role: { type: String, default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  transactionType: String,
  imageUrl: String,
  sellerId: mongoose.Schema.Types.ObjectId,
  sellerName: String,
  sellerEmail: String,
  isSold: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  productTitle: String,
  productPrice: Number,
  sellerId: mongoose.Schema.Types.ObjectId,
  sellerName: String,
  buyerId: mongoose.Schema.Types.ObjectId,
  buyerName: String,
  buyerEmail: String,
  buyerPhone: String,
  status: { type: String, default: 'pending' },
  transactionType: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Sample data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    console.log('🧹 Cleared existing data');

    // Create users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      {
        name: 'Rajesh Kumar',
        registrationNumber: 'VTU2026001',
        email: 'rajesh@vit.edu',
        password: hashedPassword,
        phone: '+91 9876543210',
        role: 'student'
      },
      {
        name: 'Priya Sharma',
        registrationNumber: 'VTU2026002',
        email: 'priya@vit.edu',
        password: hashedPassword,
        phone: '+91 9876543211',
        role: 'student'
      },
      {
        name: 'Amit Patel',
        registrationNumber: 'VTU2026003',
        email: 'amit@vit.edu',
        password: hashedPassword,
        phone: '+91 9876543212',
        role: 'student'
      },
      {
        name: 'Sneha Reddy',
        registrationNumber: 'VTU2026004',
        email: 'sneha@vit.edu',
        password: hashedPassword,
        phone: '+91 9876543213',
        role: 'student'
      },
      {
        name: 'Vikram Singh',
        registrationNumber: 'VTU2026005',
        email: 'vikram@vit.edu',
        password: hashedPassword,
        phone: '+91 9876543214',
        role: 'student'
      }
    ]);

    console.log('✅ Created 5 users (password: password123)');

    // Create products
    const products = await Product.insertMany([
      // Electronics
      {
        title: 'iPhone 13 - Excellent Condition',
        description: 'Barely used iPhone 13, 128GB, Blue color. Battery health 98%. Comes with original box and charger.',
        price: 45000,
        category: 'electronics',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500',
        sellerId: users[0]._id,
        sellerName: users[0].name,
        sellerEmail: users[0].email,
        isSold: false
      },
      {
        title: 'MacBook Pro M1 for Rent',
        description: '13-inch MacBook Pro with M1 chip, 8GB RAM, 256GB SSD. Perfect for coding and design work. Rent for ₹500/day.',
        price: 500,
        category: 'electronics',
        condition: 'good',
        transactionType: 'rent',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        sellerId: users[1]._id,
        sellerName: users[1].name,
        sellerEmail: users[1].email,
        isSold: false
      },
      {
        title: 'Gaming Mouse Logitech G502',
        description: 'High-performance gaming mouse with customizable weights and RGB lighting. Used for 6 months.',
        price: 3500,
        category: 'electronics',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
        sellerId: users[2]._id,
        sellerName: users[2].name,
        sellerEmail: users[2].email,
        isSold: false
      },
      {
        title: 'iPad Air 2022 - Like New',
        description: '10.9-inch iPad Air, 64GB, WiFi. Space Gray. Perfect for note-taking and studying. Includes Apple Pencil compatible case.',
        price: 42000,
        category: 'electronics',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
        sellerId: users[3]._id,
        sellerName: users[3].name,
        sellerEmail: users[3].email,
        isSold: false
      },

      // Books
      {
        title: 'Data Structures and Algorithms (Cormen)',
        description: 'Introduction to Algorithms by CLRS. Great condition, minimal highlighting. Essential for CS students.',
        price: 600,
        category: 'books',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        sellerId: users[0]._id,
        sellerName: users[0].name,
        sellerEmail: users[0].email,
        isSold: false
      },
      {
        title: 'Complete Engineering Mathematics Bundle',
        description: 'Full set of mathematics textbooks for first and second year. Can borrow for semester.',
        price: 0,
        category: 'books',
        condition: 'good',
        transactionType: 'borrow',
        imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=500',
        sellerId: users[4]._id,
        sellerName: users[4].name,
        sellerEmail: users[4].email,
        isSold: false
      },
      {
        title: 'Python Programming - Head First',
        description: 'Learn Python the easy way. Perfect for beginners. Book is in excellent condition.',
        price: 400,
        category: 'books',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
        sellerId: users[1]._id,
        sellerName: users[1].name,
        sellerEmail: users[1].email,
        isSold: false
      },

      // Furniture
      {
        title: 'Study Table with Chair',
        description: 'Wooden study table (4ft x 2ft) with comfortable revolving chair. Perfect for hostel room.',
        price: 3500,
        category: 'furniture',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
        sellerId: users[2]._id,
        sellerName: users[2].name,
        sellerEmail: users[2].email,
        isSold: false
      },
      {
        title: 'Mini Refrigerator',
        description: 'Small fridge perfect for hostel room. 50L capacity. Works perfectly, very energy efficient.',
        price: 4500,
        category: 'furniture',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
        sellerId: users[3]._id,
        sellerName: users[3].name,
        sellerEmail: users[3].email,
        isSold: false
      },
      {
        title: 'Bookshelf - 5 Tier',
        description: 'Tall wooden bookshelf with 5 shelves. Great for organizing books and decorations.',
        price: 2000,
        category: 'furniture',
        condition: 'fair',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500',
        sellerId: users[0]._id,
        sellerName: users[0].name,
        sellerEmail: users[0].email,
        isSold: false
      },

      // Sports
      {
        title: 'Cricket Kit - Complete Set',
        description: 'Full cricket kit including bat (English willow), pads, gloves, helmet. Lightly used.',
        price: 6000,
        category: 'sports',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
        sellerId: users[1]._id,
        sellerName: users[1].name,
        sellerEmail: users[1].email,
        isSold: false
      },
      {
        title: 'Badminton Racket - Yonex',
        description: 'Professional Yonex badminton racket. Excellent condition with cover and extra strings.',
        price: 2500,
        category: 'sports',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        sellerId: users[4]._id,
        sellerName: users[4].name,
        sellerEmail: users[4].email,
        isSold: false
      },
      {
        title: 'Gym Equipment Set',
        description: 'Dumbbells (5kg, 10kg pairs), resistance bands, yoga mat. Perfect for hostel workout.',
        price: 3000,
        category: 'sports',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
        sellerId: users[2]._id,
        sellerName: users[2].name,
        sellerEmail: users[2].email,
        isSold: false
      },

      // Stationery
      {
        title: 'Scientific Calculator - Casio FX-991EX',
        description: 'Advanced scientific calculator. Essential for engineering students. Like new condition.',
        price: 1200,
        category: 'stationery',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500',
        sellerId: users[3]._id,
        sellerName: users[3].name,
        sellerEmail: users[3].email,
        isSold: false
      },
      {
        title: 'Engineering Drawing Kit',
        description: 'Complete set with compass, divider, protractor, set squares, and drawing board.',
        price: 800,
        category: 'stationery',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500',
        sellerId: users[0]._id,
        sellerName: users[0].name,
        sellerEmail: users[0].email,
        isSold: false
      },

      // Others
      {
        title: 'Bicycle - Mountain Bike',
        description: 'Hero Sprint mountain bike, 21 gears, front suspension. Great for campus commute.',
        price: 8500,
        category: 'others',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
        sellerId: users[1]._id,
        sellerName: users[1].name,
        sellerEmail: users[1].email,
        isSold: false
      },
      {
        title: 'Electric Kettle',
        description: 'Fast boiling electric kettle, 1.5L capacity. Perfect for tea/coffee in hostel.',
        price: 600,
        category: 'others',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1594385208974-2e75f8f8da3f?w=500',
        sellerId: users[4]._id,
        sellerName: users[4].name,
        sellerEmail: users[4].email,
        isSold: false
      },
      {
        title: 'Guitar - Acoustic Yamaha',
        description: 'Yamaha F310 acoustic guitar. Great sound quality. Includes carry case and extra strings.',
        price: 7000,
        category: 'others',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500',
        sellerId: users[2]._id,
        sellerName: users[2].name,
        sellerEmail: users[2].email,
        isSold: false
      },
      {
        title: 'Headphones - Sony WH-1000XM4',
        description: 'Premium noise cancelling headphones. Perfect for studying. 6 months old, barely used.',
        price: 18000,
        category: 'electronics',
        condition: 'like-new',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
        sellerId: users[3]._id,
        sellerName: users[3].name,
        sellerEmail: users[3].email,
        isSold: false
      },
      {
        title: 'Lab Coat - White (Size M)',
        description: 'Standard white lab coat for engineering labs. Washed and ironed. Size Medium.',
        price: 300,
        category: 'others',
        condition: 'good',
        transactionType: 'buy',
        imageUrl: 'https://images.unsplash.com/photo-1579154204845-8f0a30e6e2ed?w=500',
        sellerId: users[0]._id,
        sellerName: users[0].name,
        sellerEmail: users[0].email,
        isSold: false
      }
    ]);

    console.log(`✅ Created ${products.length} products`);

    // Create some sample orders
    const orders = await Order.insertMany([
      {
        productId: products[0]._id,
        productTitle: products[0].title,
        productPrice: products[0].price,
        sellerId: users[0]._id,
        sellerName: users[0].name,
        buyerId: users[2]._id,
        buyerName: users[2].name,
        buyerEmail: users[2].email,
        buyerPhone: users[2].phone,
        status: 'confirmed',
        transactionType: 'buy'
      },
      {
        productId: products[1]._id,
        productTitle: products[1].title,
        productPrice: products[1].price,
        sellerId: users[1]._id,
        sellerName: users[1].name,
        buyerId: users[3]._id,
        buyerName: users[3].name,
        buyerEmail: users[3].email,
        buyerPhone: users[3].phone,
        status: 'pending',
        transactionType: 'rent'
      }
    ]);

    console.log(`✅ Created ${orders.length} sample orders`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🛒 Orders: ${orders.length}`);
    console.log('\n🔑 Login credentials for all users:');
    console.log('   Email: rajesh@vit.edu (or any user email)');
    console.log('   Password: password123');
    console.log('\n✅ You can now start your server with: npm start\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Connect and seed
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    return seedData();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
