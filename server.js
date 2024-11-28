require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2023-10');
const { shopifyApp } = require('@shopify/shopify-app-express');
const { Node: NodeRuntime } = require('@shopify/shopify-api/adapters/node');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Shopify configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  hostScheme: 'https',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  logger: { level: 0 },
  runtime: new NodeRuntime(),
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

  const authRoute = await shopify.auth.beginAuth({
    shop,
    redirectPath: '/auth/callback',
    isOnline: false,
  });
  
  res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const session = await shopify.auth.validateAuthCallback(
      req,
      res,
      req.query
    );

    // Store session or token as needed
    res.redirect(`/admin?shop=${session.shop}`);
  } catch (error) {
    console.error('Error during auth callback:', error);
    res.status(500).send('Error during authentication');
  }
});

// Verify Shopify requests middleware
const verifyShopifyWebhook = (req, res, next) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = req.body;
    
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64');
    
    if (hash === hmac) {
      next();
    } else {
      res.status(401).send('Invalid webhook signature');
    }
  } catch (error) {
    res.status(401).send('Invalid webhook signature');
  }
};

// Database initialization
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modal_settings (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) NOT NULL,
        title TEXT,
        content TEXT,
        button_text TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// API Routes with authentication
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

app.post('/api/modal-settings', verifyShopifyWebhook, async (req, res) => {
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

// Initialize database and start server
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
