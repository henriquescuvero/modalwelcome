require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Shopify } = require('@shopify/shopify-api');

const app = express();
const port = process.env.PORT || 3000;

// Default scopes if not provided in environment
const DEFAULT_SCOPES = ['write_script_tags', 'read_themes'];

// Shopify configuration
const shopify = new Shopify({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES ? process.env.SCOPES.split(',') : DEFAULT_SCOPES,
  hostName: process.env.HOST?.replace(/https?:\/\//, ''),
  apiVersion: '2023-10',
  isEmbeddedApp: true
});

// Validate required environment variables
const requiredEnvVars = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'HOST'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/admin/index.html');
});

// Auth endpoints
app.get('/auth', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const authUrl = await shopify.auth.beginAuth(
    req,
    res,
    shop,
    '/auth/callback',
    false
  );
  
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const session = await shopify.auth.validateAuthCallback(
      req,
      res,
      req.query
    );
    
    res.redirect(`/admin?shop=${session.shop}`);
  } catch (error) {
    console.error('Error during auth callback:', error);
    res.status(500).send('Error during authentication');
  }
});

// API Routes
app.get('/api/modal-settings/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const result = await pool.query(
      'SELECT * FROM modal_settings WHERE shop_domain = $1',
      [shopDomain]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/modal-settings', async (req, res) => {
  try {
    const { shopDomain, title, content, buttonText, active } = req.body;
    const result = await pool.query(
      `INSERT INTO modal_settings (shop_domain, title, content, button_text, active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (shop_domain) DO UPDATE
       SET title = $2, content = $3, button_text = $4, active = $5
       RETURNING *`,
      [shopDomain, title, content, buttonText, active]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
