require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Shopify } = require('@shopify/shopify-api');

const app = express();
const port = process.env.PORT || 3000;

// Shopify configuration
const shopify = new Shopify({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.HOST,
  apiVersion: '2023-10',
  isEmbeddedApp: true
});

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Auth endpoints
app.get('/auth', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const authUrl = await shopify.auth.buildAuthUrl({
    shop,
    redirectUri: `https://${process.env.HOST}/auth/callback`,
    isOnline: false,
  });
  
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { shop, code } = req.query;
    const accessToken = await shopify.auth.getAccessToken(shop, code);
    
    // Store access token securely if needed
    res.redirect(`/admin?shop=${shop}`);
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
