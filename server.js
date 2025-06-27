// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Replace with your MySQL password if needed
  database: 'yourlocalcraftsman'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// POST route to handle form submission with up to 3 file uploads
app.post('/submit', upload.array('pictures', 3), (req, res) => {
  console.log('Received submission:', req.body);
  console.log('Files:', req.files);

  const {
    name,
    phone,
    email,
    service,
    budget_min,
    budget_max,
    description,
    location
  } = req.body;

  const files = req.files || [];

  const sql = `
  INSERT INTO quotes (
    name, phone, email, service,
    budget_min, budget_max, description, location,
    image_url, image_name, image_type
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

  const values = [
    name,
    phone,
    email,
    service || '',
    budget_min || 0,
    budget_max || 0,
    description,
    location,
    files[0]?.path || '',
    files[0]?.originalname || '',
    files[0]?.mimetype || '',
    files[1]?.path || '',
    files[1]?.originalname || '',
    files[1]?.mimetype || '',
    files[2]?.path || '',
    files[2]?.originalname || '',
    files[2]?.mimetype || ''
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    console.log('Data inserted successfully:', result);
    res.json({ success: true });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});