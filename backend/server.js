const jwt = require('jsonwebtoken');
const express = require('express');
const path = require('path');
const multer = require('multer'); // Moved up with other imports
const connectDB = require('./models/db');
const User = require('./models/User');
const Event = require('./models/Events');
const Announcement = require('./models/Announcement');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

// Connect to MongoDB
connectDB();

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../frontend/Images/events/'))
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Serve static files from FRONTEND folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Parse JSON for API requests
app.use(express.json());

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bethel Department API is working!', database: 'MongoDB Connected' });
});

// User Registration - REAL IMPLEMENTATION
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, studentId, institution, major } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // This will be automatically hashed by the pre-save hook
      studentId,
      institution,
      major
    });
    
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'User registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Admin Registration - REAL IMPLEMENTATION
app.post('/api/admin/signup', async (req, res) => {
  try {
    const { name, email, password, institution, position } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Create new admin user
    const user = new User({
      name,
      email,
      password,
      institution,
      role: 'admin' // Force admin role
    });
    
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Admin account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin registration',
      error: error.message 
    });
  }
});

// Admin Middleware (more strict than regular auth)
const adminMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Admin-only: Get all events (including inactive)
app.get('/api/admin/events', adminMiddleware, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

// Admin-only: Delete event
app.delete('/api/admin/events/:id', adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event', error: error.message });
  }
});

// Admin-only: Update event
app.put('/api/admin/events/:id', adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating event', error: error.message });
  }
});

// Admin-only: Get all announcements
app.get('/api/admin/announcements', adminMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching announcements', error: error.message });
  }
});

// Admin-only: Delete announcement
app.delete('/api/admin/announcements/:id', adminMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting announcement', error: error.message });
  }
});

// Admin-only: Update announcement
app.put('/api/admin/announcements/:id', adminMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement updated successfully', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating announcement', error: error.message });
  }
});

// User Login - REAL IMPLEMENTATION
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get current user profile (protected route)
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        institution: user.institution,
        major: user.major
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Events API (protected - only authenticated users can create)
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ date: 1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

// UPDATED: Events POST route with multer for image uploads
app.post('/api/events', upload.single('image'), authMiddleware, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      isActive: true
    };
    
    // If image was uploaded, add image path to event data
    if (req.file) {
      eventData.image = 'Images/events/' + req.file.filename;
    }
    
    const event = new Event(eventData);
    await event.save();
    
    res.json({ 
      success: true, 
      message: 'Event created successfully', 
      event 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating event', 
      error: error.message 
    });
  }
});

app.post('/api/announcements', authMiddleware, async (req, res) => {
  try {
    const announcement = new Announcement({
      ...req.body,
      author: req.user.email
    });
    await announcement.save();
    res.json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating announcement', error: error.message });
  }
});

// ADD THESE NEW ROUTES RIGHT AFTER THE ABOVE ONES:
app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event', error: error.message });
  }
});

app.delete('/api/announcements/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting announcement', error: error.message });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful!',
      stats: {
        users: userCount,
        events: eventCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed', 
      error: error.message 
    });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/announcements', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Announcements.html'));
});

app.get('/archives', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Archives.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Events.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'signup.html'));
});

// SIMPLE ADMIN MAKER
app.get('/api/make-admin', async (req, res) => {
  try {
    // This makes the FIRST user in the database an admin
    const user = await User.findOneAndUpdate(
      {}, 
      { role: 'admin' }, 
      { new: true, sort: { _id: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'No users found' });
    }
    
    res.json({ 
      success: true, 
      message: `User ${user.email} is now an admin! You can login now.`,
      user 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bethel Department app running on port ${PORT}`);
});