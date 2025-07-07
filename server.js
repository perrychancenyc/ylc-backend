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
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 8080;

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('✅ SendGrid configured with API key');

// Middleware
app.use(cors({
  origin: [
    'https://www.yourlocalcraftsman.com', 
    'https://yourlocalcraftsman.com',
    'http://www.yourlocalcraftsman.com', 
    'http://yourlocalcraftsman.com',
    'http://localhost:8080',
    'http://localhost:3000'
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

// Function to generate unique reference code
function generateReferenceCode(quoteId) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion
  const numbers = '123456789'; // Removed 0 to avoid confusion with O
  let code = 'YLC-';
  
  // Add 2 random letters
  for (let i = 0; i < 2; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  // Add 1 more letter
  code += letters[Math.floor(Math.random() * letters.length)];
  
  return code;
}

// Function to send email notification using SendGrid
async function sendEmailNotification(quoteData, quoteId, uploadedFiles) {
  const { name, phone, email, service, description, location, budget_min, budget_max } = quoteData;
  
  // Prepare attachments for SendGrid
  const attachments = [];
  let imageHtml = '';
  
  if (uploadedFiles && uploadedFiles.length > 0) {
    for (const [index, file] of uploadedFiles.entries()) {
      const fileContent = fs.readFileSync(file.path);
      const base64Content = fileContent.toString('base64');
      
      attachments.push({
        content: base64Content,
        filename: file.originalname,
        type: file.mimetype,
        disposition: 'attachment',
        content_id: `image${index}`
      });
      
      // Add embedded image to HTML
      imageHtml += `
        <div style="margin: 10px 0;">
          <p style="margin: 5px 0; font-weight: bold;">Image ${index + 1}: ${file.originalname}</p>
          <img src="cid:image${index}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      `;
    }
  }
  
  // Format the email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
        New Quote Request #${quoteId}
      </h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Customer Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Project Details</h3>
        <p><strong>Service Type:</strong> ${service}</p>
        <p><strong>Budget Range:</strong> ${budget_min > 0 || budget_max > 0 ? `$${budget_min} - $${budget_max}` : 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2c5530;">
          ${description}
        </div>
      </div>
      
      ${uploadedFiles && uploadedFiles.length > 0 ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Uploaded Images</h3>
          ${imageHtml}
        </div>
      ` : `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Attachments</h3>
          <p>No images uploaded</p>
        </div>
      `}
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #2c5530; color: white; border-radius: 8px;">
        <p style="margin: 0;">Submitted on: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</p>
      </div>
    </div>
  `;

  const msg = {
    to: process.env.EMAIL_TO,
    from: process.env.EMAIL_FROM,
    subject: `New Quote Request #${quoteId} - ${service} - ${name}`,
    text: `New Quote Request #${quoteId}\n\nCustomer: ${name}\nPhone: ${phone}\nEmail: ${email || 'Not provided'}\nLocation: ${location}\n\nService: ${service}\nDescription: ${description}\n\nImages: ${uploadedFiles ? uploadedFiles.length : 0} uploaded`,
    html: emailHtml,
    attachments: attachments
  };

  try {
    await sgMail.send(msg);
    console.log('Admin notification sent successfully via SendGrid');
  } catch (error) {
    console.error('Error sending admin notification:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    // Don't throw error - we don't want email failure to break the submission
  }
}

// Function to send customer confirmation email using SendGrid
async function sendCustomerConfirmation(quoteData, quoteId) {
  const { name, phone, email, service, description, location } = quoteData;
  
  // Only send if customer provided email
  if (!email) {
    console.log('No customer email provided, skipping confirmation');
    return;
  }
  
  // Generate unique reference code
  const referenceCode = generateReferenceCode(quoteId);
  console.log(`Generated reference code ${referenceCode} for quote ID ${quoteId}`);
  
  const confirmationHtml = `
    <div style="font-family: 'Windsor Pro', Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #fff8dc;">
      <div style="text-align: center; padding: 40px 30px; background-color: #faf8f3; border-bottom: 3px solid #2c5530;">
        <h1 style="color: #2c5530; margin: 0; font-size: 36px; font-weight: normal; letter-spacing: 1px;">YOUR LOCAL CRAFTSMAN</h1>
        <p style="color: #666; margin: 10px 0; font-size: 16px; letter-spacing: 2px; text-transform: uppercase;">South Bay's Most Dependable</p>
      </div>
      
      <div style="background-color: #2c5530; color: #faf8f3; padding: 35px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: normal;">Thank You for Your Quote Request!</h2>
        <p style="margin: 0; font-size: 18px; opacity: 0.95;">We've received your submission</p>
      </div>
      
      <div style="background-color: #faf8f3; padding: 35px 30px; margin: 0; border: 1px solid #d0cec5;">
        <h3 style="color: #2c5530; margin-top: 0; font-size: 22px; font-weight: normal; border-bottom: 2px solid #d0cec5; padding-bottom: 10px;">Your Quote Details</h3>
        <p style="color: #333; margin: 12px 0;"><strong style="color: #2c5530;">Reference Number:</strong> ${referenceCode}</p>
        <p style="color: #333; margin: 12px 0;"><strong style="color: #2c5530;">Service Requested:</strong> ${service.charAt(0).toUpperCase() + service.slice(1)}</p>
        <p style="color: #333; margin: 12px 0;"><strong style="color: #2c5530;">Location:</strong> ${location}</p>
        <div style="margin-top: 20px; padding: 20px; background-color: white; border-radius: 8px; border-left: 4px solid #2c5530; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
          <p style="margin: 0 0 8px 0; color: #2c5530; font-weight: bold;">Your Project:</p>
          <p style="margin: 0; color: #666; line-height: 1.6;">${description}</p>
        </div>
      </div>
      
      <div style="background-color: #faf8f3; padding: 35px 30px; margin: 0; border: 1px solid #d0cec5; border-top: none;">
        <h3 style="color: #2c5530; margin-top: 0; font-size: 22px; font-weight: normal; border-bottom: 2px solid #d0cec5; padding-bottom: 10px;">What Happens Next?</h3>
        <ol style="color: #666; line-height: 2; padding-left: 20px; font-size: 15px;">
          <li style="margin-bottom: 8px;">We'll review your project details within 24 hours</li>
          <li style="margin-bottom: 8px;">Our craftsman will contact you at <strong style="color: #2c5530;">${phone}</strong> to discuss your needs</li>
          <li style="margin-bottom: 8px;">We'll provide a fair, transparent quote for your project</li>
          <li style="margin-bottom: 8px;">Once approved, we'll schedule your service at your convenience</li>
        </ol>
      </div>
      
      <div style="text-align: center; padding: 40px 30px; background-color: #24362f;">
        <h3 style="color: #faf8f3; margin-top: 0; font-size: 20px; font-weight: normal;">Need Immediate Assistance?</h3>
        <p style="font-size: 28px; color: #faf8f3; font-weight: normal; margin: 15px 0; letter-spacing: 1px;">
          Call Us: (323) 354-2313
        </p>
        <p style="color: #d0cec5; font-size: 14px;">Monday - Saturday, 8:00 AM - 6:00 PM</p>
      </div>
      
      <div style="text-align: center; padding: 25px 30px; color: #999; font-size: 13px; background-color: #faf8f3; border-top: 1px solid #d0cec5;">
        <p style="margin: 5px 0;">This is an automated confirmation email. Please do not reply to this message.</p>
        <p style="margin: 5px 0;">© 2025 Your Local Craftsman. All rights reserved.</p>
      </div>
    </div>
  `;
  
  const confirmationText = `
YOUR LOCAL CRAFTSMAN
South Bay's Most Dependable

Thank you for your quote request!

We've received your submission:
Reference Number: ${referenceCode}
Service Requested: ${service}
Location: ${location}

Your Project:
${description}

What Happens Next:
1. We'll review your project details within 24 hours
2. Our craftsman will contact you at ${phone} to discuss your needs
3. We'll provide a fair, transparent quote for your project
4. Once approved, we'll schedule your service at your convenience

Need Immediate Assistance?
Call Us: (323) 354-2313
Monday - Saturday, 8:00 AM - 6:00 PM

Your Local Craftsman
South Bay's Most Dependable
  `;
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `Quote Request Received - Reference ${referenceCode}`,
    text: confirmationText,
    html: confirmationHtml
  };
  
  try {
    await sgMail.send(msg);
    console.log('Customer confirmation sent to:', email);
  } catch (error) {
    console.error('Error sending customer confirmation:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    // Don't throw - confirmation failure shouldn't break the submission
  }
}

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
  // Debug logging
  console.log('=== SUBMISSION DEBUG ===');
  console.log('Headers:', req.headers['content-type']);
  console.log('Body fields:', Object.keys(req.body));
  console.log('Files:', req.files ? req.files.length : 'No files');
  console.log('Raw files object:', req.files);

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
    db.query(sql, data, async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save submission' 
        });
      }
      
      console.log('Quote saved with ID:', result.insertId);
      
      // Prepare email data
      const emailData = {
        name,
        phone,
        email,
        service,
        description,
        location,
        budget_min: parseInt(budget_min) || 0,
        budget_max: parseInt(budget_max) || 0
      };
      
      // Send admin notification with images
      await sendEmailNotification(emailData, result.insertId, images);
      
      // Send customer confirmation
      await sendCustomerConfirmation(emailData, result.insertId);
      
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

// Path to your frontend folder (sibling directory)
const FRONTEND_PATH = path.join(__dirname, '../ylc-leadcapture');

console.log('Frontend path:', FRONTEND_PATH);
console.log('Frontend exists:', fs.existsSync(FRONTEND_PATH));

// Serve static frontend files from the frontend directory
app.use(express.static(FRONTEND_PATH));

// Specific route for root
app.get('/', (req, res) => {
  const indexPath = path.join(FRONTEND_PATH, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`index.html not found at: ${indexPath}`);
  }
});

// Handle thank-you page
app.get('/thank-you.html', (req, res) => {
  const thankYouPath = path.join(FRONTEND_PATH, 'thank-you.html');
  
  if (fs.existsSync(thankYouPath)) {
    res.sendFile(thankYouPath);
  } else {
    // If thank-you.html doesn't exist, serve thank_you.png instead
    res.sendFile(path.join(FRONTEND_PATH, 'thank_you.png'));
  }
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

// Start the server with localhost binding
app.listen(PORT, '0.0.0.0', () => {
  console.log(`YLC Backend server running on port ${PORT}`);
  console.log(`Server accessible at: http://localhost:${PORT}`);
  console.log(`VPS: vps65064.dreamhostps.com`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Accepting requests from yourlocalcraftsman.com`);
});