// === server.js ===
// Load environment variables from .env file
require('dotenv').config();
console.log("Loaded DB_HOST:", process.env.DB_HOST);
const express = require('express');
const multer = require('multer');
const mysql2 = require('mysql2');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    'https://www.yourlocalcraftsman.com', 
    'https://yourlocalcraftsman.com',
    'http://www.yourlocalcraftsman.com', 
    'http://yourlocalcraftsman.com'
  ],
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Multer setup for image uploads with 5MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'mysql.yourlocalcraftsman.com',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectTimeout: 20000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
const db = mysql2.createPool(dbConfig);

// Optional: log connection test
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = db; // if you're using it in other files
// Validate required environment variables
if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
  console.error('==========================================');
  console.error('MISSING DATABASE ENVIRONMENT VARIABLES');
  console.error('==========================================');
  console.error('Please create a .env file with:');
  console.error('DB_HOST=mysql.yourlocalcraftsman.com');
  console.error('DB_USER=your_username');
  console.error('DB_PASS=your_password');
  console.error('DB_NAME=your_database');
  console.error('==========================================');
  process.exit(1);
}

// Handle connection errors
db.on('error', (err) => {
  console.error('MySQL connection error event:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

// Initial DB connection test
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MYSQL CONNECTION FAILED');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Troubleshooting tips:');
    console.error('1. Check .env file exists and has correct values');
    console.error('2. Verify remote MySQL is enabled in DreamHost');
    console.error('3. Check if VPS IP is whitelisted');
    console.error('Host:', dbConfig.host || 'NOT SET');
    console.error('User:', dbConfig.user || 'NOT SET');
    console.error('Database:', dbConfig.database || 'NOT SET');
    process.exit(1);
  } else {
    console.log('✅ MYSQL CONNECTION SUCCESSFUL');
    console.log('Connected to:', dbConfig.host);
    console.log('Database:', dbConfig.database);
    console.log('User:', dbConfig.user);
    connection.release(); // always release back to pool
  }
});

// Health check endpoint with database status
app.get('/health', (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'production',
      database: 'checking...'
    };
    
    // Use query instead of ping for mysql2
    db.query('SELECT 1', (err) => {
      if (err) {
        health.database = `disconnected: ${err.message}`;
      } else {
        health.database = 'connected';
      }
      res.json(health);
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Form submission endpoint
app.post('/submit', upload.array('images', 3), (req, res) => {
  try {
    console.log('Received submission:', req.body);
    console.log('Files received:', req.files?.length || 0);

    const {
      name,
      phone,
      email = '',
      service = req.body.projectType, // Accept projectType as service
      projectType = req.body.projectType,
      budget_min = '0',
      budget_max = '0',
      description,
      location
    } = req.body;

    if (!name || !phone || !service || !description || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const created_at = new Date();
    const images = req.files || [];

    const data = {
      name,
      phone,
      email,
      service,
      budget_min: parseInt(budget_min) || 0,
      budget_max: parseInt(budget_max) || 0,
      description,
      location,
      created_at,
      image_url: images[0] ? `/uploads/${images[0].filename}` : null,
      image_name: images[0] ? images[0].originalname : null,
      image_type: images[0] ? images[0].mimetype : null,
      image_url_1: images[1] ? `/uploads/${images[1].filename}` : null,
      image_name_1: images[1] ? images[1].originalname : null,
      image_type_1: images[1] ? images[1].mimetype : null,
      image_url_2: images[2] ? `/uploads/${images[2].filename}` : null,
      image_name_2: images[2] ? images[2].originalname : null,
      image_type_2: images[2] ? images[2].mimetype : null
    };

    const sql = `INSERT INTO quotes SET ?`;
    db.query(sql, data, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save submission' 
        });
      }
      
      console.log('Quote saved with ID:', result.insertId);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Quote request submitted successfully',
        quoteId: result.insertId 
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error occurred' 
    });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../ylc-leadcapture')));

// Route all unknown paths to index.html (for SPA or root-level navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ylc-leadcapture', 'index.html'));
});

// Error handling middleware (MUST BE LAST)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB.' 
      });
    }
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'An error occurred' 
  });
});

app.listen(PORT, () => {
  console.log(`YLC Backend server running on port ${PORT}`);
  console.log(`VPS: vps65064.dreamhostps.com`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Accepting requests from yourlocalcraftsman.com`);
});