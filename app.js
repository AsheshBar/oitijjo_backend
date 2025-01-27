const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const dotenv = require('dotenv'); // Import dotenv for environment variables
const { createClient } = require('@supabase/supabase-js');
//const mongoose = require("mongoose");
const multer = require("multer");
const fs = require('fs');
//const GridFsStorage = require("multer-gridfs-storage");
//const { GridFsStorage } = require("multer-gridfs-storage");
//const { GridFSBucket } = require("mongodb");
//const gridfsStream = require("gridfs-stream");
const path = require("path");
// Load environment variables from .env file
dotenv.config();
require('dotenv').config();

//const mongoURI = "mongodb://localhost:27017/oitijjho_imgstore"; // Change to your MongoDB URI
//const app = express();
const port = process.env.PORT || 3000;


// Create an express app
const app = express();
/*app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'uploads')));*/
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'uploads')));
// Connect to MySQL

//newly updated
const db = mysql.createConnection({
  /*host: 'localhost',
  user: 'Turjo',   // replace with your MySQL username
  password: 'Turjo_28',   // replace with your MySQL password
  database: 'userdb'*/
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync('./ca-cert.pem'), // Path to the CA certificate file
  }, // the name of your database
});



// Connect to the database
db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

// Listen on port 3000
app.listen(3000, () => {
  console.log('Server running on port ${PORT}');
});

// Supabase setup
//const supabaseUrl = 'https://uqzkzxgpurtazvclvoiu.supabase.co'
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MongoDB GridFS setup
//let gfs;
/*mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

//const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
//const { GridFSBucket } = require("mongodb");

let gfs;
const conn = mongoose.connection;
conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "uploads" });
});*/

/*conn.once("open", () => {
  gfs = gridfsStream(conn.db, mongoose.mongo);
  gfs.collection("uploads"); // Set the collection name for GridFS
});*/

// Set up GridFS storage
/*const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: "uploads", // Ensure the bucket name matches
      };
      resolve(fileInfo);
    });
  },
});*/


/*const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      bucketName: "uploads",
      filename: `${Date.now()}_${file.originalname}`,
    };
  },
});*/
//const upload = multer({ storage });

// Endpoint to upload images
/*app.post("/upload", upload.array("images", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const fileUrls = req.files.map(file => ({
    filename: file.filename,
    url: `http://localhost:3000/image/${file.filename}`, // Update the URL based on your server config
  }));

  res.status(200).json({ message: "Images uploaded successfully", files: fileUrls });
});

app.get("/image/:filename", async (req, res) => {
  try {
    const file = await gfs.find({ filename: req.params.filename }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const readstream = gfs.openDownloadStreamByName(req.params.filename);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving file" });
  }
});*/

// Endpoint to upload images
app.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const bucketName = 'oitijjho-img'; // Your Supabase bucket name
    const fileUrls = [];

    for (const file of req.files) {
      const { originalname, buffer } = file;
      const filePath = `${Date.now()}-${originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, { contentType: file.mimetype });

      if (error) {
        console.error('Error uploading file:', error.message);
        return res.status(500).json({ message: 'File upload failed', error });
      }

      const { publicUrl, error: urlError } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      if (urlError) {
        console.error('Error generating public URL:', urlError.message);
        return res.status(500).json({ message: 'Failed to generate public URL', error: urlError });
      }

      fileUrls.push({ filename: filePath, url: publicUrl });
    }

    res.status(200).json({ message: 'Images uploaded successfully', files: fileUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images', error });
  }
});

//current
/*app.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const bucketName = 'oitijjho-img'; // Use your Supabase bucket name
    const fileUrls = [];

    for (const file of req.files) {
      const { originalname, buffer } = file;
      const filePath = `${Date.now()}-${originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, { contentType: file.mimetype });

      if (error) {
        console.error('Error uploading file:', error.message);
        return res.status(500).json({ message: 'File upload failed', error });
      }

      const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      fileUrls.push({ filename: filePath, url: publicUrl });
    }

    res.status(200).json({ message: 'Images uploaded successfully', files: fileUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images', error });
  }
});*/
/*app.post("/upload", upload.array("images", 5), (req, res) => {
  res.status(200).json({ message: "Images uploaded successfully", files: req.files });
});*/

// Endpoint to get image URLs

/*app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const file = gfs.files.findOne({ filename: filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }
    const readstream = gfs.createReadStream(file.filename);
    res.set("Content-Type", file.contentType);
    readstream.pipe(res);
  });
});*/



// Register a new user

app.post('/register', (req, res) => {
  const { username, email, password, country, mobile, address, role = 'user' } = req.body;

  // Ensure only an existing admin can create another admin
  if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).send({ message: 'Only admins can create admin accounts' });
  }

  // Validate role input
  const allowedRoles = ['User','Admin','Seller'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).send({ message: 'Invalid role. Allowed roles are user and seller' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).send({ message: 'Error hashing password' });
    }

    const sql = 'INSERT INTO users (username, email, password, country, mobile, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, email, hashedPassword, country, mobile, address, role], (err, result) => {
      if (err) {
        console.error('Error inserting user into database:', err);
        return res.status(400).send({ message: 'Account creation failed' });
      }
      res.status(201).send({ message: 'User registered successfully' });
    });
  });
});



// Login user
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).send({ message: 'Error fetching user' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    const user = results[0];

    // Check password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).send({ message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(401).send({ message: 'Incorrect password' });
      }

      // Generate JWT token and send the user object
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
      res.send({ 
        message: 'Login successful', 
        token, 
        user: {  // Send the user object for the profile
          id: user.id,
          username: user.username,
          email: user.email,
          country: user.country,
          mobile: user.mobile,
          address: user.address,
          role: user.role // Make sure role is included in the response
        }
      });
    });
  });
});

app.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) throw err;

    if (result.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    const user = result[0];
    res.send({ user });
  });
});


function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Admin access required' });
  }
  next();
}


// Example of an admin-only route for managing products
app.post('/admin/add-product', authenticateToken, adminOnly, (req, res) => {
  const { productName, price } = req.body;
  const sql = 'INSERT INTO products (name, price) VALUES (?, ?)';
  
  db.query(sql, [productName, price], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).send({ message: 'Error adding product' });
    }
    res.status(201).send({ message: 'Product added successfully' });
  });
});


// Endpoint to add an on-season product (Admin only)
app.post('/admin/on-season-products', (req, res) => {
  const { name, category, price = 0.00 } = req.body; // price is optional

  const sql = 'INSERT INTO on_season_products (name, category, price) VALUES (?, ?, ?)';
  db.query(sql, [name, category, price], (err, result) => {
    if (err) {
      console.error('Error adding on-season product:', err);
      return res.status(500).send({ message: 'Error adding on-season product' });
    }
    res.status(201).send({ message: 'On-season product added successfully' });
  });
});

app.get('/on-season-products', (req, res) => {
  const sql = 'SELECT * FROM on_season_products ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching on-season products:', err);
      return res.status(500).send({ message: 'Error fetching on-season products' });
    }
    res.status(200).send(results);  // Send back products data in response
  });
});

app.post('/admin/add-product', (req, res) => {
  const { division, district, productName, productDescription } = req.body;

  const query = `
    INSERT INTO products (name, description, division_id, district_id)
    VALUES (?, ?, 
      (SELECT id FROM divisions WHERE name = ?),
      (SELECT id FROM districts WHERE name = ?)
    );
  `;

  db.query(query, [productName, productDescription, division, district], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error adding product');
    } else {
      res.status(200).send('Product added successfully');
    }
  });
});

/*app.get('/products', (req, res) => {
  const { division, district } = req.query;

  const query = `
    SELECT p.name, p.description
    FROM products p
    JOIN divisions d ON p.division_id = d.id
    JOIN districts dist ON p.district_id = dist.id
    WHERE d.name = ? AND dist.name = ?;
  `;

  db.query(query, [division, district], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching products');
    } else {
      res.status(200).json(results);
    }
  });
});*/


// Add Product Endpoint
/*app.post('/add-product', (req, res) => {
  const { seller_id, product_name, category, division, district, is_seasonal, price } = req.body;

  if (!seller_id || !product_name || !category || !division || !district || !price) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO products (seller_id, product_name, category, division, district, is_seasonal, price) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [seller_id, product_name, category, division, district, is_seasonal, price], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ message: 'Failed to add product' });
    }
    res.status(201).json({ message: 'Product added successfully' });
  });
});*/
// Add Product Endpoint with in_stock feature
/*app.post('/add-product', (req, res) => {
  const { seller_id, product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, payment_methods, images } = req.body;

  // Input validation
  if (!seller_id || !product_name || !category || !division || !district || !price || !description || !pickup_address || !payment_methods || !Array.isArray(payment_methods) || !images || !Array.isArray(images)) {
    return res.status(400).json({ message: 'All fields except "in_stock" are required' });
  }

  const stockStatus = in_stock !== undefined ? in_stock : true; // Default to true if not provided

  // SQL query to insert product
  const query = `
    INSERT INTO products (seller_id, product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, payment_methods, images) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [seller_id, product_name, category, division, district, is_seasonal, price, stockStatus, description, pickup_address, JSON.stringify(payment_methods), JSON.stringify(images)], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ message: 'Failed to add product' });
    }
    res.status(201).json({ message: 'Product added successfully' });
  });
});*/
// Endpoint to save product data
app.post('/add-product', (req, res) => {
  const { seller_id, product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, payment_methods, images } = req.body;

  if (!seller_id || !product_name || !category || !division || !district || !price || !description || !pickup_address || !payment_methods || !Array.isArray(payment_methods) || !images || !Array.isArray(images)) {
    return res.status(400).json({ message: 'All fields except "in_stock" are required' });
  }

  const stockStatus = in_stock !== undefined ? in_stock : true;
  const imageString = Array.isArray(images) ? JSON.stringify(images) : '[]';
  const query = `
    INSERT INTO products (seller_id, product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, payment_methods, images) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [seller_id, product_name, category, division, district, is_seasonal, price, stockStatus, description, pickup_address, JSON.stringify(payment_methods), imageString], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).json({ message: 'Failed to add product' });
    }
    res.status(201).json({ message: 'Product added successfully' });
  });
});

// Fetch all seasonal products
app.get('/products/seasonal', (req, res) => {
  // SQL query to fetch only seasonal products
  const query = `
    SELECT * FROM products
    WHERE is_seasonal = 1
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching seasonal products:', err);
      return res.status(500).json({ message: 'Failed to fetch seasonal products' });
    }
    res.status(200).json(results);
  });
});




app.get('/products/:category', (req, res) => {
  const { category } = req.params;

  // Input validation
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ message: 'Invalid category provided' });
  }

  // Sorting and Pagination
  const sortBy = req.query.sort || 'product_name'; // Default sort
  const validSortColumns = ['product_name', 'price'];
  if (!validSortColumns.includes(sortBy)) {
    return res.status(400).json({ message: 'Invalid sort parameter' });
  }

  const limit = parseInt(req.query.limit) || 10; // Pagination
  const offset = parseInt(req.query.offset) || 0;

  // Stock filter
  const inStock = req.query.in_stock !== 'false'; // Default is true

  // SQL Query
  const query = `
    SELECT * FROM products 
    WHERE category = ? AND (in_stock = ? OR ? = false)
    ORDER BY ${sortBy}
    LIMIT ? OFFSET ?
  `;

  db.query(query, [category, inStock, inStock, limit, offset], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No products found in this category' });
    }
    res.status(200).json(results); // Success
  });
});



// API endpoint to fetch products by district
/*app.get('/products/:district', (req, res) => {
  const { district } = req.params;
  const query = `SELECT * FROM products WHERE district = ?`;

  db.execute(query, [district], (err, results) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    return res.json(results);
  });
});*/

// Fetch Products by District
/*app.get('/products', (req, res) => {
  const { district } = req.query;

  // Input validation: ensure 'district' is provided
  if (!district) {
    return res.status(400).json({ message: 'District is required' });
  }

  // SQL query: Fetch products for a specific district
  const query = `
    SELECT p.product_name, p.description
    FROM products p
    JOIN districts dist ON p.district_id = dist.id
    WHERE dist.name = ?;
  `;

  // Execute the query with 'district' as the parameter
  db.query(query, [district], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    // Send results back to the client
    return res.status(200).json(results);
  });
});*/
// Route: Fetch products filtered by division and district
/*app.get('/products', (req, res) => {
  const { district } = req.query;

  if (!district) {
    return res.status(400).json({ error: 'Division and district are required' });
  }

  const query = `
  SELECT 
    product_name, category, division, district, description, 
    price, is_seasonal, in_stock, payment_methods, created_at
  FROM products
  WHERE district = ?;
`;*/
app.get('/products', (req, res) => {
  const { district } = req.query;

  if (!district) {
    return res.status(400).json({ error: 'District is required' });
  }

  const query = `
    SELECT id, product_name, category, division, district, description, 
           price, is_seasonal, in_stock, seller_id, payment_methods, created_at
    FROM products
    WHERE district = ?;
  `;

  db.query(query, [district], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Parse payment methods if stored as JSON string in DB
    /*const formattedResults = results.map(product => ({
      ...product,
      payment_methods: JSON.parse(product.payment_methods || '[]'),
      images: JSON.parse(product.images || '[]'),
    }));*/

    res.status(200).json(results);
  });
});



app.get('/product/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT id, product_name, category, division, district, description,
           price, is_seasonal, in_stock, seller_id, payment_methods,images, created_at
    FROM products
    WHERE id = ?;
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result[0];
    

    try {
      product.payment_methods = JSON.parse(product.payment_methods); // Ensure it's parsed correctly
    } catch (e) {
      console.error('Error parsing payment methods:', e);
      product.payment_methods = []; // Fallback to empty array
    }
    //current
    /*try {
      product.images = JSON.parse(product.images || '[]'); // Ensure images is parsed correctly
    } catch (e) {
      console.error('Error parsing images:', e);
      product.images = [];
    }*/

      /*try {
        // Safely parse the images field
        product.images = product.images ? JSON.parse(product.images) : [];
      } catch (parseError) {
        console.error('Error parsing images:', parseError);
        product.images = [];
      }*/
     // Robust image parsing
    try {
      // If images is already a JSON array, use it
      if (Array.isArray(product.images)) {
        return res.status(200).json(product);
      }

      // If images is a string of URLs, convert to array
      if (typeof product.images === 'string') {
        // Try parsing as JSON first
        try {
          product.images = JSON.parse(product.images);
        } catch {
          // If parsing fails, split the string or create a single-item array
          product.images = product.images.includes(',') 
            ? product.images.split(',').map(url => url.trim())
            : [product.images.trim()];
        }
      } else {
        product.images = [];
      }
    } catch (error) {
      console.error('Image parsing error:', error);
      product.images = [];
    }
    // Convert 'payment_methods' TEXT field to JSON array
    /*try {
      product.payment_methods = JSON.parse(product.payment_methods || '[]');
    } catch (e) {
      console.error('Error parsing payment methods:', e);
      product.payment_methods = []; // Return empty array if parsing fails
    }*/
    // Split the text into an array
      /*product.payment_methods = product.payment_methods
      ? product.payment_methods.split(',').map(method => method.trim())  // .trim() removes extra spaces
      : [];*/
      /*  product.payment_methods = product.payment_methods
      ? product.payment_methods
      .split(',')
      .map(method => method.trim()) // Trim any extra spaces
      .filter(method => /^[a-zA-Z\s]+$/.test(method)) // Allow only alphabets and spaces
      : [];*/
    /*product.payment_methods = product.payment_methods
      ? product.payment_methods.split(',')
      : [];*/
    //res.status(200).json({
      /*...product,
      payment_methods: JSON.parse(product.payment_methods || '[]'),
      //images: JSON.parse(product.images || '[]'),*/
    res.status(200).json(product);
  });
});


// Fetch a specific product by ID (Renamed to editProduct)
app.get('/editProduct/:id', (req, res) => {
  const productId = req.params.id;

  const query = 'SELECT * FROM products WHERE id = ?';

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ message: 'Failed to fetch product' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(result[0]); // Return the first matched product
  });
});


// Update a specific product by ID (Renamed to editProduct)
app.put('/editProduct/:id', (req, res) => {
  const productId = req.params.id;
  const { product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, payment_methods, images } = req.body;

  if (!product_name || !category || !division || !district || !price || !description || !payment_methods || !pickup_address || !Array.isArray(payment_methods) || !images || !Array.isArray(images)) {
    return res.status(400).json({ message: 'All fields except "in_stock" are required' });
  }

  const query = `
    UPDATE products
    SET product_name = ?, category = ?, division = ?, district = ?, is_seasonal = ?, price = ?, in_stock = ?, description = ?, pickup_address = ?, payment_methods = ?, images = ?
    WHERE id = ?
  `;

  db.query(query, [product_name, category, division, district, is_seasonal, price, in_stock, description, pickup_address, JSON.stringify(payment_methods), JSON.stringify(images), productId], (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).json({ message: 'Failed to update product' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  });
});




/*  db.query(query, [district], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.status(200).json(results);
  });
});*/

// Fetch seller profile and sales history
app.get('/profile/seller', authenticateToken, sellerOnly, (req, res) => {
  const sellerId = req.user.id;

  // SQL Query to fetch user profile and sales history
  const userQuery = 'SELECT id, username, email, country, mobile, address FROM users WHERE id = ?';
  const salesQuery = 'SELECT product_name, sale_date, quantity, total FROM sales WHERE seller_id = ? ORDER BY sale_date DESC';

  // Execute both queries
  db.query(userQuery, [sellerId], (err, userResults) => {
    if (err) {
      console.error('Error fetching user data:', err);
      return res.status(500).send({ message: 'Error fetching user profile' });
    }

    if (userResults.length === 0) {
      return res.status(404).send({ message: 'Seller profile not found' });
    }

    const user = userResults[0]; // User data

    // Fetch sales history
    db.query(salesQuery, [sellerId], (err, salesResults) => {
      if (err) {
        console.error('Error fetching sales history:', err);
        return res.status(500).send({ message: 'Error fetching sales history' });
      }

      // Combine user info and sales history
      res.status(200).send({
        profile: user,
        salesHistory: salesResults
      });
    });
  });
});


// Fetch addresses
app.get('/addresses/:userId', (req, res) => {
  const { userId } = req.params;
  db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
  });
});

// Add a new address
app.post('/addresses', (req, res) => {
  const { user_id, contact_number, road_or_village, upazila, district, division, is_default } = req.body;
  if (is_default) {
      db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [user_id], (err) => {
          if (err) return res.status(500).json(err);
      });
  }
  db.query('INSERT INTO addresses (user_id, contact_number, road_or_village, upazila, district, division, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, contact_number, road_or_village, upazila, district, division, is_default], (err, result) => {
          if (err) return res.status(500).json(err);
          res.json({ id: result.insertId });
      });
});

// Update default address
app.put('/addresses/default/:id', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [user_id], (err) => {
      if (err) return res.status(500).json(err);
      db.query('UPDATE addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [id, user_id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ success: true });
      });
  });
});


/*// Add a new review
app.post('/add-review', (req, res) => {
  const { product_id, user_id, rating, review } = req.body;

  if (!product_id || !user_id || !rating) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `INSERT INTO reviews (product_id, user_id, rating, review) VALUES (?, ?, ?, ?)`;
  db.query(query, [product_id, user_id, rating, review], (err, result) => {
    if (err) {
      console.error('Failed to add review:', err);
      return res.status(500).json({ message: 'Failed to add review' });
    }
    res.status(201).json({ message: 'Review added successfully' });
  });
});

// Fetch reviews for a product
app.get('/reviews/:id', (req, res) => {
  const productId = req.params.id;

  const query = `
    SELECT r.rating, r.review, r.created_at, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?;
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
    res.status(200).json(results);
  });
});*/

// Add a new review
app.post('/add-review', (req, res) => {
  const { product_id, user_id, rating, review } = req.body;

  // Validate input data
  if (!product_id || !user_id || rating === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Ensure rating is a valid number between 0 and 5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 0 and 5' });
  }

  const query = `INSERT INTO reviews (product_id, user_id, rating, review) VALUES (?, ?, ?, ?)`;
  db.query(query, [product_id, user_id, rating, review], (err, result) => {
    if (err) {
      console.error('Failed to add review:', err);
      return res.status(500).json({ message: 'Failed to add review' });
    }
    res.status(201).json({ message: 'Review added successfully' });
  });
});


// Fetch reviews for a product
app.get('/reviews/:id', (req, res) => {
  const productId = req.params.id;

  const query = `
    SELECT r.rating, r.review, r.created_at, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?;
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // If no reviews are found, send an empty array
    res.status(200).json(results);
  });
});




app.put('/edit-product/:id', (req, res) => {

  const productId = req.params.id;

  const { product_name, category, division, district, is_seasonal, price, in_stock, description, payment_methods, images } = req.body;



  // Input validation

  if (!product_name || !category || !division || !district || !price || !description || !payment_methods || !Array.isArray(payment_methods) || !images || !Array.isArray(images)) {

    return res.status(400).json({ message: 'All fields except "in_stock" are required' });

  }



  const stockStatus = in_stock !== undefined ? in_stock : true; // Default to true if not provided



  // SQL query to update product

  const query = `

    UPDATE products

    SET product_name = ?, category = ?, division = ?, district = ?, is_seasonal = ?, price = ?, in_stock = ?, description = ?, payment_methods = ?, images = ?

    WHERE id = ?

  `;



  db.query(query, [product_name, category, division, district, is_seasonal, price, stockStatus, description, JSON.stringify(payment_methods), JSON.stringify(images), productId], (err, result) => {

    if (err) {

      console.error('Error updating product:', err);

      return res.status(500).json({ message: 'Failed to update product' });

    }

    if (result.affectedRows === 0) {

      return res.status(404).json({ message: 'Product not found' });

    }

    res.status(200).json({ message: 'Product updated successfully' });

  });

});



app.delete('/delete-product/:id', (req, res) => {

  const productId = req.params.id;



  // SQL query to delete the product

  const query = `DELETE FROM products WHERE id = ?`;



  db.query(query, [productId], (err, result) => {

    if (err) {

      console.error('Error deleting product:', err);

      return res.status(500).json({ message: 'Failed to delete product' });

    }

    if (result.affectedRows === 0) {

      return res.status(404).json({ message: 'Product not found' });

    }

    res.status(200).json({ message: 'Product deleted successfully' });

  });

});


app.get('/get-products/:seller_id', (req, res) => {

  const sellerId = req.params.seller_id;



  const query = `SELECT * FROM products WHERE seller_id = ? ORDER BY id DESC`;



  db.query(query, [sellerId], (err, results) => {

    if (err) {

      console.error('Error fetching products:', err);

      return res.status(500).json({ message: 'Failed to fetch products' });

    }

    res.status(200).json(results);

  });

});


// API to Place an Order
/*app.post('/order', (req, res) => {
  const { buyerId, sellerId, productId, paymentMethod, status, total_price, quantity } = req.body;

  if (!buyerId || !sellerId || !productId || !paymentMethod || !status || !total_price || !quantity) {
    res.status(400).send('Missing required fields');
    return;
  }

  const query = 'INSERT INTO orders (buyer_id, seller_id, product_id, payment_method, status, total_price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [buyerId, sellerId, productId, paymentMethod, status, total_price, quantity], (err, results) => {
    if (err) {
      res.status(500).send('Error placing order');
      return;
    }
    // Insert notification
    const notificationQuery = 'INSERT INTO notifications (seller_id, message) VALUES (?, ?)';
    const message = `New order placed by Buyer ID ${buyerId} for Product ID ${productId}.`;
    db.query(notificationQuery, [sellerId, message], (notifErr) => {
      if (notifErr) {
        res.status(500).send('Error creating notification');
        return;
      }
    res.status(201).json({ orderId: results.insertId, message: 'Order placed successfully' });
  });
});*/

app.post('/order', (req, res) => {
  const { buyerId, sellerId, productId, paymentMethod, status, total_price, quantity } = req.body;

  if (!buyerId || !sellerId || !productId || !paymentMethod || !status || !total_price || !quantity) {
    res.status(400).send('Missing required fields');
    return;
  }

  // Insert order into the database
  const orderQuery = `
    INSERT INTO orders (buyer_id, seller_id, product_id, payment_method, status, total_price, quantity) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    orderQuery,
    [buyerId, sellerId, productId, paymentMethod, status, total_price, quantity],
    (orderErr, orderResults) => {
      if (orderErr) {
        res.status(500).send('Error placing order');
        return;
      }

      const orderId = orderResults.insertId;

      // Fetch product name and buyer name for the notification message
      const fetchDetailsQuery = `
        SELECT 
          p.product_name, 
          u.username AS buyer_name 
        FROM 
          products p
        JOIN 
          users u 
        ON 
          u.id = ? 
        WHERE 
          p.id = ?`;

      db.query(fetchDetailsQuery, [buyerId, productId], (detailsErr, detailsResults) => {
        if (detailsErr || detailsResults.length === 0) {
          res.status(500).send('Error fetching product or buyer details');
          return;
        }

        const { product_name: productName, buyer_name: buyerName } = detailsResults[0];
        const message = `Order ID ${orderId}: ${buyerName} placed an order for ${productName}.`;

        // Insert notification into the database
        const notificationQuery = 'INSERT INTO notifications (seller_id, message) VALUES (?, ?)';
        db.query(notificationQuery, [sellerId, message], (notifErr) => {
          if (notifErr) {
            res.status(500).send('Error creating notification');
            return;
          }

          res.status(201).json({
            orderId: orderId,
            message: 'Order placed successfully',
            notificationMessage: message,
          });
        });
      });
    }
  );
});

/*app.put('/order/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).send('Missing required fields');
    return;
  }

  // Update order status in the database
  const updateQuery = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(updateQuery, [status, id], (updateErr, updateResults) => {
    if (updateErr) {
      res.status(500).send('Error updating order status');
      return;
    }

    if (updateResults.affectedRows === 0) {
      res.status(404).send('Order not found');
      return;
    }

    // Fetch product, buyer details for the notification
    const fetchDetailsQuery = `
      SELECT 
        o.product_id, 
        p.product_name, 
        o.buyer_id 
      FROM 
        orders o 
      JOIN 
        products p 
      ON 
        o.product_id = p.id 
      WHERE 
        o.id = ?
    `;
    db.query(fetchDetailsQuery, [id], (detailsErr, detailsResults) => {
      if (detailsErr || detailsResults.length === 0) {
        res.status(500).send('Error fetching order details');
        return;
      }

      const { product_id: productId, product_name: productName, buyer_id: buyerId } = detailsResults[0];
      const message = `Your order (ID: ${id}) for ${productName} has been ${status.toLowerCase()}.`;

      // Insert buyer notification
      const notificationQuery = 'INSERT INTO notifications (buyer_id, message) VALUES (?, ?)';
      db.query(notificationQuery, [buyerId, message], (notifErr) => {
        if (notifErr) {
          res.status(500).send('Error creating notification');
          return;
        }

        res.status(200).json({
          message: 'Order status updated and buyer notified',
        });
      });
    });
  });
});*/
app.put('/order/:id/status', (req, res) => {
  const { id } = req.params; // Order ID
  const { status } = req.body; // New status

  if (!status) {
    res.status(400).send('Status is required');
    return;
  }

  // Update order status in the database
  const updateQuery = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(updateQuery, [status, id], (updateErr, updateResults) => {
    if (updateErr) {
      console.error('Error updating order status:', updateErr);
      res.status(500).send('Error updating order status');
      return;
    }

    if (updateResults.affectedRows === 0) {
      res.status(404).send('Order not found');
      return;
    }

    // Fetch order, product, and buyer details
    const fetchDetailsQuery = `
      SELECT 
        o.product_id, 
        p.product_name, 
        o.buyer_id, 
        o.seller_id, 
        o.total_price, 
        o.quantity,
        u.username AS buyer_name
      FROM 
        orders o
      JOIN 
        products p ON o.product_id = p.id
      JOIN 
        users u ON o.buyer_id = u.id
      WHERE 
        o.id = ?
    `;

    db.query(fetchDetailsQuery, [id], (detailsErr, detailsResults) => {
      if (detailsErr || detailsResults.length === 0) {
        console.error('Error fetching order details:', detailsErr);
        res.status(500).send('Error fetching order details');
        return;
      }

      const { 
        product_id: productId, 
        product_name: productName, 
        buyer_id: buyerId, 
        seller_id: sellerId, 
        total_price: totalPrice, 
        quantity,
        buyer_name: buyerName 
      } = detailsResults[0];

      // Create notification message
      const message = `Your order (ID: ${id}) for ${productName} has been ${status.toLowerCase()}.`;

      // Insert notification into the database
      const notificationQuery = 'INSERT INTO buyer_notifications (buyer_id, message) VALUES (?, ?)';
      db.query(notificationQuery, [buyerId, message], (notifErr) => {
        if (notifErr) {
          console.error('Error creating notification:', notifErr);
          res.status(500).send('Error creating notification');
          return;
        }

        // If status is 'Delivered', add to sales history
        if (status === 'Delivered') {
          const insertHistoryQuery = `
            INSERT INTO sales_history (order_id, product_id, seller_id, buyer_id, product_name, buyer_name, total_price, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(
            insertHistoryQuery,
            [id, productId, sellerId, buyerId, productName, buyerName, totalPrice, quantity],
            (historyErr) => {
              if (historyErr) {
                console.error('Error adding to sales history:', historyErr);
                res.status(500).send('Error adding to sales history');
                return;
              }

              res.status(200).json({
                message: 'Order status updated, buyer notified, and sales history added',
              });
            }
          );
        } else {
          res.status(200).json({
            message: 'Order status updated and buyer notified',
          });
        }
      });
    });
  });
});



app.get('/notifications/buyer/:buyerId', (req, res) => {
  const { buyerId } = req.params;

  const query = `
    SELECT 
      id, 
      message, 
      is_read, 
      created_at 
    FROM 
      buyer_notifications 
    WHERE 
      buyer_id = ? 
    ORDER BY 
      created_at DESC
  `;
  db.query(query, [buyerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching notifications');
      return;
    }
    res.status(200).json(results);
  });
});



app.get('/notifications/:sellerId', (req, res) => {
  const sellerId = req.params.sellerId;

  const query = 'SELECT * FROM notifications WHERE seller_id = ? AND is_read = FALSE ORDER BY created_at DESC';
  db.query(query, [sellerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching notifications');
      return;
    }
    res.status(200).json(results);
    });
  });



// API to Fetch Seller's Orders

app.get('/seller/:id/orders', (req, res) => {
  const sellerId = req.params.id;

  const query = `
    SELECT 
      o.id AS order_id,
      o.product_id,
      p.product_name AS product_name, -- Use 'p.name' instead of 'p.username'
      o.buyer_id,
      u.username AS buyer_name, -- Confirm column name in 'users' table
      o.payment_method,
      o.status,
      o.total_price,
      o.quantity, -- Include quantity in the response
      o.order_date,
      o.delivery_date
    FROM 
      orders o
    JOIN 
      products p ON o.product_id = p.id -- Fix table name 'products'
    JOIN 
      users u ON o.buyer_id = u.id
    WHERE 
      o.seller_id = ?`;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err); // Log error for debugging
      res.status(500).send('Error fetching orders');
      return;
    }

    const formattedResults = results.map(order => ({
      id: Number(order.order_id),
      product_id: Number(order.product_id),
      product_name: order.product_name,
      buyer_id: Number(order.buyer_id),
      buyer_name: order.buyer_name,
      payment_method: order.payment_method,
      status: order.status,
      total_price: parseFloat(order.total_price),
      quantity: Number(order.quantity), // Add quantity here
      order_date: order.order_date,
      delivery_date: order.delivery_date
    }));

    res.json({ orders: formattedResults });
  });
});

/*app.get('/seller/:id/orders', (req, res) => {
  const sellerId = req.params.id;

  // Updated Query with JOIN
  const query = `
    SELECT 
      o.id AS order_id,
      o.product_id,
      p.username AS product_name, -- Product Name
      o.buyer_id,
      u.username AS buyer_name, -- Buyer Name
      o.payment_method,
      o.status,
      o.total_price,
      o.order_date,
      o.delivery_date
    FROM 
      orders o
    JOIN 
      products p ON o.product_id = p.id -- Join with products table
    JOIN 
      users u ON o.buyer_id = u.id -- Join with users table
    WHERE 
      o.seller_id = ?`;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching orders');
      return;
    }

    // Format results before sending
    const formattedResults = results.map(order => ({
      id: Number(order.order_id), // Convert to int
      product_id: Number(order.product_id), // Convert to int
      product_name: order.product_name, // Product Name
      buyer_id: Number(order.buyer_id), // Convert to int
      buyer_name: order.buyer_name, // Buyer Name
      payment_method: order.payment_method, // String
      status: order.status, // String
      total_price: parseFloat(order.total_price), // Float
      order_date: order.order_date, // String
      delivery_date: order.delivery_date // String or null
    }));

    res.json({ orders: formattedResults });
  });
});*/

/*app.get('/seller/:id/orders', (req, res) => {
  const sellerId = req.params.id;

  const query = 'SELECT * FROM orders WHERE seller_id = ?';
  db.query(query, [sellerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching orders');
      return;
    }

    // Explicitly convert types before sending response
    const formattedResults = results.map(order => ({
      id: Number(order.id), // Convert to integer
      buyer_id: Number(order.buyer_id), // Convert to integer
      seller_id: Number(order.seller_id), // Convert to integer
      product_id: Number(order.product_id), // Convert to integer
      payment_method: order.payment_method, // Keep as string
      status: order.status, // Keep as string
      total_price: parseFloat(order.total_price), // Convert to float
      order_date: order.order_date, // Keep as string or format as needed
      delivery_date: order.delivery_date // Keep as string or null
    }));

    res.json({ orders: formattedResults }); // Wrap data in 'orders' key
  });
});*/

/*app.get('/seller/:id/orders', (req, res) => {
  const sellerId = req.params.id;

  const query = 'SELECT * FROM orders WHERE seller_id = ?';
  db.query(query, [sellerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching orders');
      return;
    }
    res.json(results);
  });
});*/

// API to Update Order Status
//current working
/*app.put('/order/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(query, [status, orderId], (err) => {
    if (err) {
      res.status(500).send('Error updating order status');
      return;
    }
    res.json({ message: 'Order status updated successfully' });
  });
});*/
app.put('/order/:id/status', (req, res) => {
  const { id } = req.params; // Order ID
  const { status } = req.body;

  if (!status) {
    return res.status(400).send('Status is required');
  }

  // Query to update the order status
  const updateOrderQuery = 'UPDATE orders SET status = ? WHERE id = ?';

  // Query to insert into sales_history if status is 'Delivered'
    /*INSERT INTO sales_history (order_id, product_id, seller_id, buyer_id, product_name, buyer_name, total_price, quantity)
    SELECT 
      o.id AS order_id,
      o.product_id,
      o.seller_id,
      o.buyer_id,
      p.product_name,
      u.username AS buyer_name,
      o.total_price,
      o.quantity
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON o.buyer_id = u.id
    WHERE o.id = ? AND ? = 'Delivered'
  `;*/
  const insertHistoryQuery = `
  INSERT INTO sales_history (order_id, product_id, seller_id, buyer_id, product_name, buyer_name, total_price, quantity)
  SELECT 
    o.id, o.product_id, o.seller_id, o.buyer_id,
    p.product_name, u.username, o.total_price, o.quantity
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN users u ON o.buyer_id = u.id
  WHERE o.id = ? AND ? = 'Delivered'
`;
  

  // Update the order status
  db.query(updateOrderQuery, [status, id], (err, results) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).send('Error updating order status');
    }
    
    // If the status is 'Delivered,' insert into sales_history
    if (status === 'Delivered') {
      db.query(insertHistoryQuery, [id, status], (err, results) => {
        if (err) {
          console.error('Error adding to sales history:', err);
          return res.status(500).send('Error adding to sales history');
        }
        res.status(200).send('Order status updated and sales history added');
      });
    } else {
      res.status(200).send('Order status updated');
    }
  });
});

app.get('/orders/:buyerId', (req, res) => {
  const { buyerId } = req.params;

  if (!buyerId) {
    res.status(400).send('Missing buyer ID');
    return;
  }

  const query = `
    SELECT o.id AS orderId, o.product_id AS productId, p.product_name AS productName, 
           o.status, o.total_price AS totalPrice, o.quantity, o.payment_method AS paymentMethod, 
           DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') AS orderDate
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.buyer_id = ?
    ORDER BY FIELD(o.status, 'Pending', 'Confirmed', 'Delivered') ASC, o.id DESC
  `;

  db.query(query, [buyerId], (err, results) => {
    if (err) {
      res.status(500).send('Error fetching orders');
      return;
    }

    const groupedOrders = results.reduce((acc, order) => {
      if (!acc[order.status]) acc[order.status] = [];
      acc[order.status].push(order);
      return acc;
    }, {});

    res.status(200).json(groupedOrders);
  });
});



app.get('/seller/:id/sales-history', (req, res) => {
  const { id } = req.params; // Seller ID

  const query = `
    SELECT 
      sh.id AS sale_id,
      sh.order_id,
      sh.product_id,
      p.product_name,
      sh.buyer_id,
      u.username AS buyer_name,
      sh.sale_date,
      sh.total_price,
      sh.quantity,
      (sh.total_price * sh.quantity) AS total_amount
    FROM sales_history sh
    JOIN products p ON sh.product_id = p.id
    JOIN users u ON sh.buyer_id = u.id
    WHERE sh.seller_id = ?
    ORDER BY sh.sale_date DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching sales history:', err);
      return res.status(500).send('Error fetching sales history');
    }
    res.json({ salesHistory: results });
  });
});


app.get('/seller/:id/sales-history/monthly', (req, res) => {
  const { id } = req.params; // Seller ID

  const query = `
    SELECT 
      DATE_FORMAT(sh.sale_date, '%Y-%m') AS month,
      SUM(sh.total_price * sh.quantity) AS total_amount
    FROM sales_history sh
    WHERE sh.seller_id = ?
    GROUP BY month
    ORDER BY month
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching monthly sales history:', err);
      return res.status(500).send('Error fetching monthly sales history');
    }
    res.json({ monthlySales: results });
  });
});


app.get('/seller/:id/sales-history/yearly', (req, res) => {
  const { id } = req.params; // Seller ID

  const query = `
    SELECT 
      YEAR(sh.sale_date) AS year,
      SUM(sh.total_price * sh.quantity) AS total_amount
    FROM sales_history sh
    WHERE sh.seller_id = ?
    GROUP BY year
    ORDER BY year
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching yearly sales history:', err);
      return res.status(500).send('Error fetching yearly sales history');
    }
    res.json({ yearlySales: results });
  });
});


/*app.get('/search-products', (req, res) => {
  const { query, category, in_stock, sort_by, sort_order } = req.query;
  
  let whereClauses = [];
  let queryParams = [];

  // Search by product name (using LIKE for partial matching)
  if (query) {
    whereClauses.push('product_name LIKE ?');
    queryParams.push(`%${query}%`);
  }

  // Filter by category
  if (category) {
    whereClauses.push('category = ?');
    queryParams.push(category);
  }

  // Filter by in-stock status
  if (in_stock !== undefined) {
    whereClauses.push('in_stock = ?');
    queryParams.push(in_stock === 'true' ? 1 : 0);
  }

  // If no filters are applied, use the default where clause
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Sorting options
  let orderByClause = '';
  if (sort_by && sort_order) {
    orderByClause = `ORDER BY ${sort_by} ${sort_order}`;
  } else {
    // Default sort by product name
    orderByClause = 'ORDER BY product_name ASC';
  }

  // SQL query to fetch products
  const queryString = `
    SELECT * FROM products
    ${whereClause}
    ${orderByClause}
  `;

  db.query(queryString, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }
    res.status(200).json(results);
  });
});*/

app.get('/search-products', (req, res) => {
  const { query, category, in_stock, sort_by, sort_order } = req.query;

  let whereClauses = [];
  let queryParams = [];

  // Search by product name (partial matching)
  if (query) {
    whereClauses.push('LOWER(product_name) LIKE ?');
    queryParams.push(`%${query.toLowerCase()}%`);
  }

  // Filter by category
  if (category) {
    whereClauses.push('category = ?');
    queryParams.push(category);
  }

  // Filter by in-stock status
  if (in_stock !== undefined) {
    whereClauses.push('in_stock = ?');
    queryParams.push(in_stock === 'true' ? 1 : 0);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Sorting
  let orderByClause = '';
  if (sort_by && sort_order) {
    const validSortFields = ['product_name', 'price', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    if (validSortFields.includes(sort_by) && validSortOrders.includes(sort_order.toUpperCase())) {
      orderByClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    }
  } else {
    orderByClause = 'ORDER BY product_name ASC'; // Default sort
  }

  const queryString = `
    SELECT id, product_name, category, price, in_stock
    FROM products
    ${whereClause}
    ${orderByClause}
  `;

  db.query(queryString, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    res.status(200).json(results);
  });
});





function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Token received:', token); // Add log here

  if (!token) return res.status(403).send({ message: 'Token required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err); // Log any verification errors
      return res.status(403).send({ message: 'Invalid token' });
    }
    req.user = user; // Attach decoded user object, including role
    console.log('Decoded user:', user); // Log the decoded user
    next();
  });
}

const cors = require('cors');
app.use(cors());

// Middleware to restrict access to admin users only
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Admin access required' });
  }
  next();
}

function sellerOnly(req, res, next) {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).send({ message: 'Seller access required' });
  }
  next();
}

  
