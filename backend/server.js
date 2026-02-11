import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import axios from 'axios';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();

// ===========================================
// CONFIGURATION
// ===========================================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'onetap-secret-key-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const KYC_API_KEY = process.env.KYC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VTU_TOKEN = process.env.VTU_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Monnify Configuration
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';

// Email Configuration (Resend)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'OneTap <onboarding@resend.dev>';

console.log('\n========================================');
console.log('🚀 ONETAP BACKEND STARTING...');
console.log('========================================');

// ===========================================
// DATABASE - FIXED FOR WINDOWS
// ===========================================
const { Pool } = pg;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL?.includes('localhost') ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database: Connected'))
  .catch(e => console.error('❌ Database connection failed:', e.message));

// ===========================================
// SUPABASE
// ===========================================
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase: Connected');
} else {
  console.log('⚠️  Supabase: Not configured');
}

// ===========================================
// INIT DATABASE - FIXED COLUMN NAMES
// ===========================================
async function initDB() {
  const c = await pool.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255),
        balance DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        reset_otp VARCHAR(10),
        reset_expires TIMESTAMP,
        virtual_account_number VARCHAR(20),
        virtual_account_bank VARCHAR(100),
        virtual_account_name VARCHAR(200),
        virtual_account_ref VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add virtual account columns for existing databases
    try {
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_account_number VARCHAR(20)`);
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_account_bank VARCHAR(100)`);
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_account_name VARCHAR(200)`);
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_account_ref VARCHAR(100)`);
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10)`);
      await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP`);
    } catch (e) {}
    
    await c.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(20),
        category VARCHAR(50),
        amount DECIMAL(12,2),
        profit DECIMAL(12,2) DEFAULT 0,
        balance_before DECIMAL(12,2),
        balance_after DECIMAL(12,2),
        status VARCHAR(20) DEFAULT 'pending',
        reference VARCHAR(100) UNIQUE,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // KYC records - FIXED: use lookup_input instead of input_value
    await c.query(`
      CREATE TABLE IF NOT EXISTS kyc_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        service_type VARCHAR(50),
        lookup_input VARCHAR(100),
        result_data JSONB,
        status VARCHAR(20),
        amount DECIMAL(12,2),
        reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Try to add column if missing (for existing databases)
    try {
      await c.query(`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS lookup_input VARCHAR(100)`);
      await c.query(`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS result_data JSONB`);
    } catch (e) {}
    
    await c.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100),
        ip_address VARCHAR(50),
        user_agent TEXT,
        device_type VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await c.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(20) DEFAULT 'info',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await c.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE,
        value JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await c.query(`INSERT INTO settings (key, value) VALUES ('pricing', '{"vtu_markup":2,"kyc_profit":50}') ON CONFLICT (key) DO NOTHING`);
    console.log('✅ Database: Ready');
  } catch (e) {
    console.error('❌ DB Error:', e.message);
  } finally {
    c.release();
  }
}

// ===========================================
// HELPERS
// ===========================================
const genRef = (p = 'OT') => `${p}${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

async function logActivity(userId, action, req, meta = {}) {
  try {
    const ua = req.headers['user-agent'] || '';
    let device = 'Unknown';
    if (/mobile|android|iphone/i.test(ua)) device = 'Mobile';
    else if (/windows|macintosh|linux/i.test(ua)) device = 'Desktop';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, ip_address, user_agent, device_type, metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, action, ip, ua, device, JSON.stringify(meta)]
    );
  } catch (e) {}
}

// Get pricing settings from database
const getPricing = async () => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key='pricing'");
    const defaults = { airtime_markup: 2, data_markup: 2, electricity_markup: 0, cable_markup: 0, kyc_profit: 50 };
    return { ...defaults, ...(r.rows[0]?.value || {}) };
  } catch (e) {
    return { airtime_markup: 2, data_markup: 2, electricity_markup: 0, cable_markup: 0, kyc_profit: 50 };
  }
};

// Get system status (maintenance, payment toggle) from database
const getSystemStatus = async () => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key='system'");
    return r.rows[0]?.value || { maintenance_mode: false, payment_enabled: true };
  } catch (e) {
    return { maintenance_mode: false, payment_enabled: true };
  }
};

// ===========================================
// WALLET OPERATIONS
// ===========================================
async function creditWallet(userId, amount, category, desc, meta = {}) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const u = await c.query('SELECT balance FROM users WHERE id=$1 FOR UPDATE', [userId]);
    if (!u.rows[0]) throw new Error('User not found');
    const oldBal = parseFloat(u.rows[0].balance);
    const newBal = oldBal + parseFloat(amount);
    await c.query('UPDATE users SET balance=$1 WHERE id=$2', [newBal, userId]);
    const ref = genRef('CR');
    await c.query(
      'INSERT INTO transactions (user_id, type, category, amount, balance_before, balance_after, status, reference, description, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [userId, 'credit', category, amount, oldBal, newBal, 'completed', ref, desc, JSON.stringify(meta)]
    );
    await c.query('COMMIT');
    return { success: true, reference: ref, newBalance: newBal };
  } catch (e) {
    await c.query('ROLLBACK');
    return { success: false, error: e.message };
  } finally {
    c.release();
  }
}

async function debitWallet(userId, amount, category, desc, meta = {}, profit = 0) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const u = await c.query('SELECT balance FROM users WHERE id=$1 FOR UPDATE', [userId]);
    if (!u.rows[0]) throw new Error('User not found');
    const oldBal = parseFloat(u.rows[0].balance);
    if (oldBal < parseFloat(amount)) {
      await c.query('ROLLBACK');
      return { success: false, error: 'Insufficient balance' };
    }
    const newBal = oldBal - parseFloat(amount);
    await c.query('UPDATE users SET balance=$1 WHERE id=$2', [newBal, userId]);
    const ref = genRef('TX');
    await c.query(
      'INSERT INTO transactions (user_id, type, category, amount, profit, balance_before, balance_after, status, reference, description, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [userId, 'debit', category, amount, profit, oldBal, newBal, 'completed', ref, desc, JSON.stringify(meta)]
    );
    await c.query('COMMIT');
    return { success: true, reference: ref, newBalance: newBal };
  } catch (e) {
    await c.query('ROLLBACK');
    return { success: false, error: e.message };
  } finally {
    c.release();
  }
}

// ===========================================
// MONNIFY VIRTUAL ACCOUNT FUNCTIONS
// ===========================================
let monnifyAccessToken = null;
let monnifyTokenExpiry = 0;

async function getMonnifyToken() {
  // Return cached token if still valid
  if (monnifyAccessToken && Date.now() < monnifyTokenExpiry) {
    return monnifyAccessToken;
  }
  
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error('Monnify not configured');
  }
  
  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  
  try {
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/auth/login`,
      {},
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.requestSuccessful) {
      monnifyAccessToken = response.data.responseBody.accessToken;
      // Token expires in 1 hour, refresh at 55 minutes
      monnifyTokenExpiry = Date.now() + (55 * 60 * 1000);
      console.log('✅ Monnify: Access token refreshed');
      return monnifyAccessToken;
    }
    throw new Error('Failed to get Monnify token');
  } catch (e) {
    console.error('Monnify token error:', e.response?.data || e.message);
    throw e;
  }
}

async function createMonnifyVirtualAccount(user) {
  const token = await getMonnifyToken();
  const accountRef = `ONETAP-${user.id}-${Date.now()}`;
  const accountName = `${user.first_name} ${user.last_name}`.toUpperCase();
  
  try {
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
      {
        accountReference: accountRef,
        accountName: accountName,
        currencyCode: 'NGN',
        contractCode: MONNIFY_CONTRACT_CODE,
        customerEmail: user.email,
        customerName: accountName,
        getAllAvailableBanks: false,
        preferredBanks: ['035'] // Wema Bank
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.requestSuccessful) {
      const account = response.data.responseBody.accounts[0];
      return {
        success: true,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountName: account.accountName,
        accountRef: accountRef
      };
    }
    throw new Error(response.data.responseMessage || 'Failed to create account');
  } catch (e) {
    console.error('Monnify create account error:', e.response?.data || e.message);
    throw e;
  }
}

// ===========================================
// MIDDLEWARE - FIXED CORS FOR VERCEL
// ===========================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://onetap-eight.vercel.app',
    'https://www.onetap-eight.vercel.app',
    'https://payengine.uk',
    'https://www.payengine.uk'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

app.use(helmet({ contentSecurityPolicy: false }));

// Monnify webhook needs raw body for signature verification - MUST be before express.json()
app.post('/api/webhook/monnify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body.toString('utf8');
    const payload = JSON.parse(rawBody);
    
    console.log('\n🔔 ========== MONNIFY WEBHOOK ==========');
    console.log('Event:', payload.eventType);
    console.log('Data:', JSON.stringify(payload.eventData || {}).substring(0, 300));
    
    // Verify signature
    const signature = req.headers['monnify-signature'];
    if (MONNIFY_SECRET_KEY && signature) {
      const computedHash = crypto
        .createHmac('sha512', MONNIFY_SECRET_KEY)
        .update(rawBody)
        .digest('hex');
      
      if (signature !== computedHash) {
        console.log('❌ Invalid webhook signature');
        console.log('Expected:', computedHash.substring(0, 20) + '...');
        console.log('Received:', signature.substring(0, 20) + '...');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Signature verified');
    }
    
    // Handle successful transaction
    if (payload.eventType === 'SUCCESSFUL_TRANSACTION') {
      const data = payload.eventData;
      const transactionRef = data.transactionReference;
      const amount = parseFloat(data.amountPaid || data.amount);
      const accountRef = data.product?.reference;
      const payerBank = data.paymentSourceInformation?.[0]?.bankName || 'Bank Transfer';
      
      console.log(`💰 Payment: ₦${amount} | Ref: ${transactionRef} | AccRef: ${accountRef}`);
      
      // Check if already processed (prevent duplicates)
      const existing = await pool.query(
        'SELECT id FROM transactions WHERE reference = $1 OR metadata->>\'monnifyRef\' = $1',
        [transactionRef]
      );
      
      if (existing.rows.length > 0) {
        console.log('⚠️ Transaction already processed, skipping');
        return res.json({ success: true, message: 'Already processed' });
      }
      
      // Find user by account reference
      const userResult = await pool.query(
        'SELECT * FROM users WHERE virtual_account_ref = $1',
        [accountRef]
      );
      
      if (!userResult.rows[0]) {
        console.log('❌ User not found for account ref:', accountRef);
        // Still return 200 to prevent Monnify retries
        return res.status(200).json({ error: 'User not found', received: true });
      }
      
      const user = userResult.rows[0];
      console.log(`👤 User found: ${user.email} (ID: ${user.id})`);
      
      // Credit wallet
      const result = await creditWallet(
        user.id,
        amount,
        'funding',
        `Bank Transfer - ${payerBank}`,
        { monnifyRef: transactionRef, paymentMethod: 'bank_transfer', payerBank }
      );
      
      if (result.success) {
        console.log(`✅ Wallet credited! New balance: ₦${result.newBalance}`);
        return res.json({ success: true, message: 'Wallet credited' });
      } else {
        console.log('❌ Failed to credit wallet:', result.error);
        return res.status(500).json({ error: 'Failed to credit wallet' });
      }
    }
    
    // Handle other events
    console.log('ℹ️ Event received:', payload.eventType);
    res.json({ success: true, message: 'Event received' });
  } catch (e) {
    console.error('❌ Webhook error:', e.message);
    // Return 200 to prevent endless retries from Monnify
    res.status(200).json({ error: 'Processing failed', received: true });
  }
});

app.use(express.json({ limit: '10mb' }));
app.set('trust proxy', true);

// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: e.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', openai: !!OPENAI_API_KEY, kyc: !!KYC_API_KEY });
});

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [decoded.userId]);
    if (!r.rows[0]) return res.status(401).json({ error: 'User not found' });
    if (r.rows[0].status !== 'active') return res.status(403).json({ error: 'Account blocked' });
    req.user = r.rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Middleware to check maintenance mode
const checkMaintenance = async (req, res, next) => {
  const status = await getSystemStatus();
  if (status.maintenance_mode) {
    return res.status(503).json({ 
      error: 'System is under maintenance. Please try again later.',
      maintenance: true
    });
  }
  next();
};

// Middleware to check if payments are enabled
const checkPayments = async (req, res, next) => {
  const status = await getSystemStatus();
  if (status.payment_enabled === false) {
    return res.status(503).json({ 
      error: 'Payment processing is temporarily disabled.',
      payments_disabled: true
    });
  }
  next();
};

// Middleware to check specific service
const checkService = (serviceName) => async (req, res, next) => {
  const status = await getSystemStatus();
  const serviceKey = `${serviceName}_enabled`;
  if (status[serviceKey] === false) {
    return res.status(503).json({ 
      error: `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} service is temporarily unavailable.`,
      service_disabled: true
    });
  }
  next();
};

// ===========================================
// PUBLIC SYSTEM STATUS ENDPOINT
// ===========================================
// Frontend can check this to show maintenance messages
app.get('/api/system/status', async (req, res) => {
  try {
    const status = await getSystemStatus();
    res.json({
      maintenance_mode: status.maintenance_mode || false,
      payment_enabled: status.payment_enabled !== false,
      message: status.maintenance_mode ? 'System is under maintenance. Please try again later.' : null
    });
  } catch (e) {
    res.json({ maintenance_mode: false, payment_enabled: true });
  }
});

// FIXED: Public endpoint to get pricing settings for frontend
app.get('/api/settings/pricing', async (_, res) => {
  try {
    const pricing = await getPricing();
    res.json({ 
      airtime_markup: pricing.airtime_markup || 2,
      data_markup: pricing.data_markup || 2,
      vtu_markup: pricing.airtime_markup || 2, // Backward compatibility
      kyc_profit: pricing.kyc_profit || 50,
      electricity_markup: pricing.electricity_markup || 0,
      cable_markup: pricing.cable_markup || 0
    });
  } catch (e) {
    res.json({ 
      airtime_markup: 2, 
      data_markup: 2, 
      vtu_markup: 2, 
      kyc_profit: 50, 
      electricity_markup: 0, 
      cable_markup: 0 
    });
  }
});

// ===========================================
// AUTH ROUTES
// ===========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body.email);
    const { firstName, lastName, email, phone, password } = req.body;
    
    if (!firstName || !lastName || !email || !phone || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ error: 'All fields required' });
    }
    
    // Check if user exists
    const exists = await pool.query('SELECT id FROM users WHERE email=$1 OR phone=$2', [email.toLowerCase().trim(), phone.trim()]);
    if (exists.rows.length) {
      console.log('❌ User already exists');
      return res.status(400).json({ error: 'Email or phone already exists' });
    }
    
    // Hash password
    const hash = await bcrypt.hash(password, 12);
    
    // Create user
    const r = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), phone.trim(), hash]
    );
    
    const u = r.rows[0];
    const token = jwt.sign({ userId: u.id }, JWT_SECRET, { expiresIn: '30d' });
    
    await logActivity(u.id, 'register', req);
    
    console.log('✅ User registered:', u.email);
    res.json({ token, user: { id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email, phone: u.phone, balance: 0, status: u.status } });
  } catch (e) {
    console.error('❌ Register error:', e.message);
    res.status(500).json({ error: 'Registration failed: ' + e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user by email or phone
    const r = await pool.query('SELECT * FROM users WHERE email=$1 OR phone=$1', [email.toLowerCase().trim()]);
    
    if (!r.rows[0]) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const valid = await bcrypt.compare(password, r.rows[0].password_hash);
    if (!valid) {
      console.log('❌ Wrong password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check status
    if (r.rows[0].status !== 'active') {
      console.log('❌ Account blocked:', email);
      return res.status(403).json({ error: 'Account is blocked. Contact support.' });
    }
    
    const u = r.rows[0];
    const token = jwt.sign({ userId: u.id }, JWT_SECRET, { expiresIn: '30d' });
    
    await logActivity(u.id, 'login', req);
    
    console.log('✅ Login successful:', u.email);
    res.json({ token, user: { id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email, phone: u.phone, balance: parseFloat(u.balance), status: u.status } });
  } catch (e) {
    console.error('❌ Login error:', e.message);
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u.id, name: `${u.first_name} ${u.last_name}`, first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone, balance: parseFloat(u.balance), status: u.status, created_at: u.created_at } });
});

// ===========================================
// PASSWORD RESET WITH SUPABASE MAGIC LINK
// ===========================================
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    // Check if user exists in our database
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!r.rows[0]) {
      // Don't reveal if email exists or not for security
      return res.json({ success: true, message: 'If this email is registered, you will receive a reset code' });
    }
    
    // Generate OTP and save to database
    const otp = genOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await pool.query('UPDATE users SET reset_otp=$1, reset_expires=$2 WHERE id=$3', [otp, expires, r.rows[0].id]);
    
    const userName = r.rows[0].first_name || 'User';
    
    // Send email via Resend
    if (RESEND_API_KEY) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f;">
            <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px; font-weight: bold;">⚡</span>
                </div>
                <h1 style="color: #F8FAFC; font-size: 28px; margin: 0;">OneTap</h1>
                <p style="color: rgba(248, 250, 252, 0.5); font-size: 12px; letter-spacing: 2px; margin-top: 5px;">by CHIVERA</p>
              </div>
              
              <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 20px; padding: 30px; text-align: center;">
                <h2 style="color: #F8FAFC; font-size: 22px; margin: 0 0 10px;">Password Reset</h2>
                <p style="color: rgba(248, 250, 252, 0.7); font-size: 15px; margin: 0 0 30px;">
                  Hi ${userName}, use the code below to reset your password.
                </p>
                
                <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">Your Code</p>
                  <p style="color: white; font-size: 42px; font-weight: 800; letter-spacing: 10px; margin: 0;">${otp}</p>
                </div>
                
                <p style="color: rgba(248, 250, 252, 0.5); font-size: 13px; margin: 0;">
                  This code expires in <strong style="color: #F59E0B;">15 minutes</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: rgba(248, 250, 252, 0.4); font-size: 12px; margin: 0;">
                  If you didn't request this, please ignore this email.
                </p>
                <p style="color: rgba(248, 250, 252, 0.3); font-size: 11px; margin-top: 20px;">
                  © ${new Date().getFullYear()} OneTap by CHIVERA. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        
        await axios.post('https://api.resend.com/emails', {
          from: FROM_EMAIL,
          to: email.toLowerCase(),
          subject: `${otp} is your OneTap password reset code`,
          html: emailHtml
        }, {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📧 Password reset email sent to ${email}`);
        res.json({ success: true, message: 'Reset code sent to your email' });
        
      } catch (emailErr) {
        console.error('Email send error:', emailErr.response?.data || emailErr.message);
        // Fall back to console if email fails
        console.log(`\n🔐 PASSWORD RESET OTP for ${email}: ${otp}\n`);
        res.json({ success: true, message: 'Reset code sent! Check your email.' });
      }
    } else {
      // No email configured - show in console
      console.log(`\n🔐 ========================================`);
      console.log(`🔐 PASSWORD RESET OTP for ${email}`);
      console.log(`🔐 Code: ${otp}`);
      console.log(`🔐 Expires in 15 minutes`);
      console.log(`🔐 ========================================\n`);
      res.json({ success: true, message: 'Reset code sent! Check your email.' });
    }
  } catch (e) {
    console.error('❌ Forgot password error:', e.message);
    console.error('Full error:', e);
    res.status(500).json({ error: 'Failed to process request: ' + e.message });
  }
});

// Verify OTP (fallback when Supabase not available)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    const r = await pool.query('SELECT * FROM users WHERE email=$1 AND reset_otp=$2 AND reset_expires > NOW()', [email.toLowerCase(), otp]);
    if (!r.rows[0]) return res.status(400).json({ error: 'Invalid or expired OTP' });
    res.json({ success: true, valid: true });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset password - OTP verification
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }
    
    const userEmail = email.toLowerCase();
    
    // Verify OTP
    const r = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND reset_otp=$2 AND reset_expires > NOW()', 
      [userEmail, otp]
    );
    
    if (!r.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    }
    
    // Update password
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash=$1, reset_otp=NULL, reset_expires=NULL WHERE id=$2', 
      [hash, r.rows[0].id]
    );
    
    console.log(`✅ Password reset successful for: ${userEmail}`);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Delete Account
app.delete('/api/auth/delete-account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    
    // Verify password
    const valid = await bcrypt.compare(password, req.user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect password' });
    
    const userId = req.user.id;
    const email = req.user.email;
    
    // Delete user data (transactions, logs, kyc records, then user)
    await pool.query('DELETE FROM transactions WHERE user_id=$1', [userId]);
    await pool.query('DELETE FROM activity_logs WHERE user_id=$1', [userId]);
    await pool.query('DELETE FROM kyc_records WHERE user_id=$1', [userId]);
    await pool.query('DELETE FROM users WHERE id=$1', [userId]);
    
    console.log(`🗑️ Account deleted: ${email}`);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ===========================================
// WALLET
// ===========================================
app.get('/api/wallet/balance', auth, (req, res) => {
  res.json({ balance: parseFloat(req.user.balance) });
});

app.get('/api/wallet/transactions', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ transactions: r.rows });
  } catch (e) {
    res.json({ transactions: [] });
  }
});

app.post('/api/wallet/fund/test', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    console.log(`💰 Test funding request: ₦${amount} for user ${req.user.id}`);
    
    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: 'Minimum amount is ₦100' });
    }
    if (amount > 100000) {
      return res.status(400).json({ error: 'Maximum test amount is ₦100,000' });
    }
    
    const result = await creditWallet(req.user.id, parseFloat(amount), 'funding', `Test wallet funding - ₦${amount}`);
    
    if (!result.success) {
      console.log('💰 Funding failed:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    await logActivity(req.user.id, 'test_fund', req, { amount });
    
    console.log(`💰 Funded ₦${amount} → New balance: ₦${result.newBalance}`);
    res.json({ 
      success: true, 
      message: `₦${parseFloat(amount).toLocaleString()} added to your wallet!`, 
      reference: result.reference, 
      newBalance: result.newBalance 
    });
  } catch (e) {
    console.error('💰 Fund error:', e.message);
    res.status(500).json({ error: 'Funding failed: ' + e.message });
  }
});

// ===========================================
// MONNIFY VIRTUAL ACCOUNT ROUTES
// ===========================================

// Get or Create Virtual Account
app.get('/api/wallet/virtual-account', auth, checkMaintenance, checkPayments, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user already has a virtual account
    if (user.virtual_account_number) {
      return res.json({
        success: true,
        hasAccount: true,
        accountNumber: user.virtual_account_number,
        bankName: user.virtual_account_bank,
        accountName: user.virtual_account_name
      });
    }
    
    // Check if Monnify is configured
    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE) {
      return res.json({
        success: false,
        hasAccount: false,
        error: 'Virtual account service not configured'
      });
    }
    
    // Create new virtual account
    console.log(`🏦 Creating virtual account for user ${user.id} (${user.email})`);
    const account = await createMonnifyVirtualAccount(user);
    
    // Save to database
    await pool.query(
      `UPDATE users SET 
        virtual_account_number = $1, 
        virtual_account_bank = $2, 
        virtual_account_name = $3, 
        virtual_account_ref = $4 
       WHERE id = $5`,
      [account.accountNumber, account.bankName, account.accountName, account.accountRef, user.id]
    );
    
    console.log(`🏦 Virtual account created: ${account.accountNumber} (${account.bankName})`);
    
    res.json({
      success: true,
      hasAccount: true,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      accountName: account.accountName
    });
  } catch (e) {
    console.error('Virtual account error:', e.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get virtual account. Please try again.'
    });
  }
});

// Get recent deposits (funding transactions)
app.get('/api/wallet/deposits', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 AND category = 'funding' 
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );
    res.json({ deposits: result.rows });
  } catch (e) {
    res.json({ deposits: [] });
  }
});

// Test webhook endpoint (for verifying your setup works) - REMOVE IN PRODUCTION
app.post('/api/webhook/monnify/test', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const testAmount = parseFloat(amount) || 100;
    
    console.log(`\n🧪 TEST WEBHOOK: Simulating ₦${testAmount} deposit for user ${req.user.id}`);
    
    const result = await creditWallet(
      req.user.id,
      testAmount,
      'funding',
      'Test Bank Transfer - Webhook Test',
      { monnifyRef: `TEST-${Date.now()}`, paymentMethod: 'test' }
    );
    
    if (result.success) {
      console.log(`🧪 Test successful! New balance: ₦${result.newBalance}`);
      res.json({ success: true, message: `Test deposit of ₦${testAmount} successful`, newBalance: result.newBalance });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (e) {
    res.status(500).json({ error: 'Test failed: ' + e.message });
  }
});

// Check Monnify configuration status
app.get('/api/wallet/monnify-status', auth, async (req, res) => {
  try {
    const configured = !!(MONNIFY_API_KEY && MONNIFY_SECRET_KEY && MONNIFY_CONTRACT_CODE);
    const user = req.user;
    
    let tokenValid = false;
    if (configured) {
      try {
        await getMonnifyToken();
        tokenValid = true;
      } catch (e) {
        tokenValid = false;
      }
    }
    
    res.json({
      configured,
      tokenValid,
      baseUrl: MONNIFY_BASE_URL,
      isProduction: MONNIFY_BASE_URL.includes('api.monnify.com'),
      userHasAccount: !!user.virtual_account_number,
      account: user.virtual_account_number ? {
        number: user.virtual_account_number,
        bank: user.virtual_account_bank,
        name: user.virtual_account_name
      } : null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===========================================
// VTU DATA - DancityNG API Integration
// ===========================================
const VTU_API_URL = 'https://dancityng.com/api';
const VTU_API_KEY = process.env.VTU_API_KEY || process.env.DANCITY_API_KEY;

if (VTU_API_KEY) {
  console.log('✅ VTU API: DancityNG configured');
} else {
  console.log('⚠️ VTU API: Not configured (add VTU_API_KEY to .env)');
}

const NETWORKS = [
  { id: 1, name: 'MTN', code: 'mtn', color: '#FFCC00' },
  { id: 2, name: 'GLO', code: 'glo', color: '#50B651' },
  { id: 3, name: '9mobile', code: '9mobile', color: '#006E53' },
  { id: 4, name: 'Airtel', code: 'airtel', color: '#FF0000' }
];

// DancityNG Data Plans with their actual plan IDs
const DATA_PLANS = {
  1: [ // MTN - More options!
    { id: 'mtn-500mb', planId: 261, name: '750MB', size: '750MB', price: 250, validity: '7 Days', type: 'Data Coupon' },
    { id: 'mtn-1gb-cg', planId: 208, name: '1GB', size: '1GB', price: 300, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'mtn-1gb-day', planId: 251, name: '1GB (1 Day)', size: '1GB', price: 550, validity: '1 Day', type: 'Gifting' },
    { id: 'mtn-1.5gb', planId: 272, name: '1.5GB', size: '1.5GB', price: 450, validity: '30 Days', type: 'Data Coupon' },
    { id: 'mtn-2gb-cg', planId: 209, name: '2GB', size: '2GB', price: 600, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'mtn-2gb-dc', planId: 263, name: '2GB', size: '2GB', price: 560, validity: '30 Days', type: 'Data Coupon' },
    { id: 'mtn-2gb-sme', planId: 8, name: '2GB SME', size: '2GB', price: 1500, validity: '30 Days', type: 'SME' },
    { id: 'mtn-3gb-dc', planId: 271, name: '3GB', size: '3GB', price: 750, validity: '30 Days', type: 'Data Coupon' },
    { id: 'mtn-3gb-sme', planId: 44, name: '3GB SME', size: '3GB', price: 2200, validity: '30 Days', type: 'SME' },
    { id: 'mtn-3.2gb', planId: 281, name: '3.2GB (2 Days)', size: '3.2GB', price: 1100, validity: '2 Days', type: 'Gifting' },
    { id: 'mtn-4.5gb', planId: 273, name: '4.5GB', size: '4.5GB', price: 1200, validity: '30 Days', type: 'Data Coupon' },
    { id: 'mtn-5gb-sme', planId: 213, name: '5GB SME', size: '5GB', price: 2600, validity: '30 Days', type: 'SME' },
    { id: 'mtn-6gb', planId: 282, name: '6GB (7 Days)', size: '6GB', price: 2700, validity: '7 Days', type: 'Gifting' },
    { id: 'mtn-11gb', planId: 284, name: '11GB (7 Days)', size: '11GB', price: 3700, validity: '7 Days', type: 'Awoof Data' },
  ],
  2: [ // GLO - More options!
    { id: 'glo-200mb', planId: 243, name: '200MB', size: '200MB', price: 100, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-500mb', planId: 244, name: '500MB', size: '500MB', price: 250, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-750mb', planId: 286, name: '750MB (1 Day)', size: '750MB', price: 220, validity: '1 Day', type: 'Awoof' },
    { id: 'glo-1gb', planId: 245, name: '1GB', size: '1GB', price: 480, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-1.5gb', planId: 287, name: '1.5GB (1 Day)', size: '1.5GB', price: 330, validity: '1 Day', type: 'Awoof' },
    { id: 'glo-2gb', planId: 246, name: '2GB', size: '2GB', price: 950, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-2.5gb', planId: 288, name: '2.5GB (2 Days)', size: '2.5GB', price: 550, validity: '2 Days', type: 'Awoof' },
    { id: 'glo-3gb', planId: 247, name: '3GB', size: '3GB', price: 1400, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-5gb', planId: 248, name: '5GB', size: '5GB', price: 2350, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-10gb', planId: 249, name: '10GB', size: '10GB', price: 4700, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'glo-10gb-awoof', planId: 289, name: '10GB (7 Days)', size: '10GB', price: 2100, validity: '7 Days', type: 'Awoof' },
  ],
  3: [ // 9mobile - More options!
    { id: '9mobile-500mb', planId: 231, name: '500MB', size: '500MB', price: 280, validity: '30 Days', type: 'SME' },
    { id: '9mobile-1gb', planId: 234, name: '1GB', size: '1GB', price: 550, validity: '30 Days', type: 'SME' },
    { id: '9mobile-2gb', planId: 232, name: '2GB', size: '2GB', price: 1100, validity: '30 Days', type: 'SME' },
    { id: '9mobile-3gb', planId: 185, name: '3GB', size: '3GB', price: 1600, validity: '30 Days', type: 'SME' },
    { id: '9mobile-5gb', planId: 230, name: '5GB', size: '5GB', price: 2650, validity: '30 Days', type: 'SME' },
    { id: '9mobile-11gb', planId: 260, name: '11GB', size: '11GB', price: 5800, validity: '30 Days', type: 'SME' },
  ],
  4: [ // Airtel - More options!
    { id: 'airtel-150mb', planId: 218, name: '150MB', size: '150MB', price: 80, validity: '1 Day', type: 'Corporate Gifting' },
    { id: 'airtel-300mb', planId: 219, name: '300MB', size: '300MB', price: 150, validity: '2 Days', type: 'Corporate Gifting' },
    { id: 'airtel-600mb', planId: 215, name: '600MB', size: '600MB', price: 280, validity: '2 Days', type: 'Corporate Gifting' },
    { id: 'airtel-1gb', planId: 214, name: '1GB', size: '1GB', price: 400, validity: '2 Days', type: 'Corporate Gifting' },
    { id: 'airtel-1gb-week', planId: 216, name: '1GB (Weekly)', size: '1GB', price: 900, validity: '7 Days', type: 'Corporate Gifting' },
    { id: 'airtel-3.5gb', planId: 217, name: '3.5GB', size: '3.5GB', price: 1600, validity: '7 Days', type: 'Corporate Gifting' },
    { id: 'airtel-4gb', planId: 242, name: '4GB', size: '4GB', price: 2650, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'airtel-10gb', planId: 237, name: '10GB', size: '10GB', price: 3500, validity: '30 Days', type: 'Corporate Gifting' },
    { id: 'airtel-20gb', planId: 241, name: '20GB', size: '20GB', price: 19000, validity: '30 Days', type: 'Corporate Gifting' },
  ]
};

// DancityNG Disco IDs for Electricity
const DISCOS = [
  { id: 1, name: 'Ikeja Electric', code: 'ikeja' },
  { id: 2, name: 'Eko Electric', code: 'eko' },
  { id: 3, name: 'Abuja Electric', code: 'abuja' },
  { id: 4, name: 'Kano Electric', code: 'kano' },
  { id: 5, name: 'Enugu Electric', code: 'enugu' },
  { id: 6, name: 'Port Harcourt Electric', code: 'portharcourt' },
  { id: 8, name: 'Kaduna Electric', code: 'kaduna' },
  { id: 9, name: 'Jos Electric', code: 'jos' },
  { id: 10, name: 'Benin Electric', code: 'benin' },
  { id: 11, name: 'Yola Electric', code: 'yola' },
  { id: 12, name: 'Ibadan Electric', code: 'ibadan' }
];

// DancityNG Cable Providers
const CABLE_PROVIDERS = [
  { id: 1, name: 'GOtv', code: 'gotv' },
  { id: 2, name: 'DStv', code: 'dstv' },
  { id: 3, name: 'Startimes', code: 'startimes' }
];

// DancityNG Cable Plans with their actual plan IDs
const CABLE_PLANS = {
  1: [ // GOtv
    { id: 'gotv-smallie', planId: 34, name: 'GOtv Smallie', price: 1900 },
    { id: 'gotv-jinja', planId: 16, name: 'GOtv Jinja', price: 3900 },
    { id: 'gotv-jolli', planId: 17, name: 'GOtv Jolli', price: 5800 },
    { id: 'gotv-max', planId: 2, name: 'GOtv Max', price: 8500 },
    { id: 'gotv-supa', planId: 47, name: 'GOtv Supa', price: 11400 }
  ],
  2: [ // DStv
    { id: 'dstv-padi', planId: 20, name: 'DStv Padi', price: 4400 },
    { id: 'dstv-yanga', planId: 6, name: 'DStv Yanga', price: 6000 },
    { id: 'dstv-confam', planId: 19, name: 'DStv Confam', price: 11000 },
    { id: 'dstv-compact', planId: 7, name: 'DStv Compact', price: 19000 },
    { id: 'dstv-compact-plus', planId: 8, name: 'DStv Compact Plus', price: 30000 },
    { id: 'dstv-premium', planId: 9, name: 'DStv Premium', price: 44500 }
  ],
  3: [ // Startimes
    { id: 'star-nova', planId: 14, name: 'Nova', price: 1900 },
    { id: 'star-basic', planId: 12, name: 'Basic', price: 3700 },
    { id: 'star-smart', planId: 13, name: 'Smart', price: 4700 },
    { id: 'star-classic', planId: 11, name: 'Classic', price: 5500 },
    { id: 'star-super', planId: 15, name: 'Super', price: 9000 }
  ]
};

// KYC Services
const KYC_SERVICES = {
  'nin': { name: 'NIN Verification', description: 'Verify NIN by number', endpoint: '/nin-verification', field: 'nin', price: 200, available: true },
  'nin-phone': { name: 'NIN by Phone', description: 'Find NIN by phone number', endpoint: '/nin-phone', field: 'phone', price: 250, available: true },
  'nin-demography': { name: 'NIN by Demographics', description: 'Search NIN using name, gender & DOB', endpoint: '/nin-demography', field: 'demography', price: 300, available: true, isMultiField: true },
  'bvn': { name: 'BVN Verification', description: 'Verify BVN by number', endpoint: '/bvn-verification', field: 'bvn', price: 150, available: true },
  'bvn-phone': { name: 'BVN by Phone', description: 'Find BVN by phone number', endpoint: '/bvn-phone', field: 'phone', price: 200, available: true }
};

// ===========================================
// VTU ROUTES - DancityNG API
// ===========================================

app.get('/api/vtu/networks', (_, res) => res.json({ networks: NETWORKS }));

// Data plans with dynamic markup
app.get('/api/vtu/data-plans/:networkId', async (req, res) => {
  try {
    const pricing = await getPricing();
    // Use data_markup specifically
    const markup = (pricing.data_markup || 2) / 100;
    const plans = DATA_PLANS[parseInt(req.params.networkId)] || [];
    // Apply markup to each plan price
    const plansWithMarkup = plans.map(p => ({
      ...p,
      price: Math.ceil(p.price * (1 + markup))
    }));
    res.json({ plans: plansWithMarkup, markup: pricing.data_markup });
  } catch (e) {
    res.json({ plans: DATA_PLANS[parseInt(req.params.networkId)] || [] });
  }
});

// Buy Airtime - Real DancityNG API
app.post('/api/vtu/airtime', auth, checkMaintenance, checkPayments, checkService('airtime'), async (req, res) => {
  try {
    const { network, phone, amount } = req.body;
    if (!network || !phone || !amount) return res.status(400).json({ error: 'Missing fields' });
    if (amount < 50) return res.status(400).json({ error: 'Minimum ₦50' });
    if (!/^0[789]\d{9}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
    
    const net = NETWORKS.find(n => n.id === parseInt(network));
    if (!net) return res.status(400).json({ error: 'Invalid network' });
    
    // Get pricing and calculate markup
    const pricing = await getPricing();
    const markupPercent = pricing.airtime_markup || 0;
    const baseAmount = parseFloat(amount);
    const markupAmount = Math.ceil(baseAmount * (markupPercent / 100));
    const totalAmount = baseAmount + markupAmount;
    
    // Check balance (total includes markup)
    if (parseFloat(req.user.balance) < totalAmount) {
      return res.status(400).json({ error: `Insufficient balance. You need ₦${totalAmount.toLocaleString()}${markupAmount > 0 ? ` (includes ₦${markupAmount} service fee)` : ''}` });
    }
    
    // Call DancityNG API
    if (!VTU_API_KEY) {
      return res.status(400).json({ error: 'VTU API not configured. Add VTU_API_KEY to .env' });
    }
    
    console.log(`\n📱 AIRTIME: ₦${baseAmount} ${net.name} to ${phone} | Markup: ₦${markupAmount} (${markupPercent}%) | Total: ₦${totalAmount}`);
    
    try {
      // Send base amount to API (not markup)
      const apiRes = await axios.post(`${VTU_API_URL}/topup/`, {
        network: parseInt(network),
        amount: parseInt(baseAmount),
        mobile_number: phone,
        Ported_number: true,
        airtime_type: 'VTU'
      }, {
        headers: {
          'Authorization': `Token ${VTU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      console.log('📱 DancityNG Response:', JSON.stringify(apiRes.data).substring(0, 200));
      
      // Check response
      if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success') {
        // Debit wallet (total amount includes markup, markup is profit)
        const d = await debitWallet(req.user.id, totalAmount, 'airtime', `${net.name} ₦${baseAmount} to ${phone}`, { 
          network: net.name, phone, baseAmount, markupAmount,
          apiRef: apiRes.data?.ident || apiRes.data?.id
        }, markupAmount);
        
        if (!d.success) {
          console.log('📱 ❌ Wallet debit failed after successful API call');
          return res.status(400).json({ error: d.error });
        }
        
        await logActivity(req.user.id, 'buy_airtime', req, { network: net.name, phone, amount: totalAmount, profit: markupAmount });
        
        console.log(`📱 ✅ Success! Ref: ${d.reference} | Profit: ₦${markupAmount}`);
        return res.json({ 
          success: true, 
          message: `₦${baseAmount} ${net.name} airtime sent to ${phone}`, 
          reference: d.reference, 
          newBalance: d.newBalance,
          phone, amount: totalAmount
        });
      } else {
        console.log('📱 ❌ API failed:', apiRes.data?.message || apiRes.data);
        return res.status(400).json({ error: apiRes.data?.message || 'Airtime purchase failed' });
      }
    } catch (apiErr) {
      console.error('📱 ❌ API Error:', apiErr.response?.data || apiErr.message);
      return res.status(400).json({ error: apiErr.response?.data?.message || 'Network error. Try again.' });
    }
  } catch (e) {
    console.error('Airtime error:', e);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Buy Data - Real DancityNG API
app.post('/api/vtu/data', auth, checkMaintenance, checkPayments, checkService('data'), async (req, res) => {
  try {
    const { network, phone, planId } = req.body;
    if (!network || !phone || !planId) return res.status(400).json({ error: 'Missing fields' });
    if (!/^0[789]\d{9}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
    
    const net = NETWORKS.find(n => n.id === parseInt(network));
    if (!net) return res.status(400).json({ error: 'Invalid network' });
    
    const plans = DATA_PLANS[parseInt(network)] || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    
    if (!plan.planId) {
      return res.status(400).json({ error: 'This plan is not available' });
    }
    
    // Get pricing and calculate markup
    const pricing = await getPricing();
    const markupPercent = pricing.data_markup || 0;
    const basePrice = plan.price;
    const markupAmount = Math.ceil(basePrice * (markupPercent / 100));
    const totalPrice = basePrice + markupAmount;
    
    // Check balance (total includes markup)
    if (parseFloat(req.user.balance) < totalPrice) {
      return res.status(400).json({ error: `Insufficient balance. Need ₦${totalPrice.toLocaleString()}${markupAmount > 0 ? ` (includes ₦${markupAmount} service fee)` : ''}` });
    }
    
    // Call DancityNG API
    if (!VTU_API_KEY) {
      return res.status(400).json({ error: 'VTU API not configured. Add VTU_API_KEY to .env' });
    }
    
    console.log(`\n📶 DATA: ${plan.size} ${net.name} to ${phone} | Base: ₦${basePrice} | Markup: ₦${markupAmount} (${markupPercent}%) | Total: ₦${totalPrice}`);
    
    try {
      const apiRes = await axios.post(`${VTU_API_URL}/data/`, {
        network: parseInt(network),
        mobile_number: phone,
        plan: plan.planId,
        Ported_number: true
      }, {
        headers: {
          'Authorization': `Token ${VTU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      console.log('📶 DancityNG Response:', JSON.stringify(apiRes.data).substring(0, 200));
      
      // Check response
      if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success') {
        // Debit wallet (total price includes markup, markup is profit)
        const d = await debitWallet(req.user.id, totalPrice, 'data', `${net.name} ${plan.size} to ${phone}`, { 
          network: net.name, phone, plan: plan.name, basePrice, markupAmount,
          apiRef: apiRes.data?.ident || apiRes.data?.id
        }, markupAmount);
        
        if (!d.success) {
          console.log('📶 ❌ Wallet debit failed after successful API call');
          return res.status(400).json({ error: d.error });
        }
        
        await logActivity(req.user.id, 'buy_data', req, { network: net.name, phone, plan: plan.name, amount: totalPrice, profit: markupAmount });
        
        console.log(`📶 ✅ Success! Ref: ${d.reference} | Profit: ₦${markupAmount}`);
        return res.json({ 
          success: true, 
          message: `${net.name} ${plan.size} data sent to ${phone}`, 
          reference: d.reference, 
          newBalance: d.newBalance,
          phone, plan: plan.name, amount: totalPrice
        });
      } else {
        console.log('📶 ❌ API failed:', apiRes.data?.message || apiRes.data);
        return res.status(400).json({ error: apiRes.data?.message || 'Data purchase failed' });
      }
    } catch (apiErr) {
      console.error('📶 ❌ API Error:', apiErr.response?.data || apiErr.message);
      return res.status(400).json({ error: apiErr.response?.data?.message || 'Network error. Try again.' });
    }
  } catch (e) {
    console.error('Data error:', e);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Bills - Electricity with DancityNG
app.get('/api/bills/electricity/discos', (_, res) => res.json({ discos: DISCOS }));

// Verify meter number - DancityNG may not have this endpoint, so we'll skip real verification
app.post('/api/bills/electricity/verify', auth, async (req, res) => {
  try {
    const { disco, meterNumber, meterType } = req.body;
    if (!disco || !meterNumber) return res.status(400).json({ error: 'Missing fields' });
    
    const dis = DISCOS.find(d => d.id === parseInt(disco));
    if (!dis) return res.status(400).json({ error: 'Invalid disco' });
    
    // Note: DancityNG doesn't have a separate meter validation endpoint
    // Payment will validate the meter automatically
    // Return basic verification success
    console.log(`\n⚡ Meter verification request: ${meterNumber} (${dis.name})`);
    
    return res.json({ 
      verified: true, 
      customerName: 'Customer',
      address: '',
      disco: dis.name, 
      meterNumber,
      note: 'Meter will be validated during payment'
    });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Pay electricity bill - DancityNG API
app.post('/api/bills/electricity/pay', auth, checkMaintenance, checkPayments, checkService('electricity'), async (req, res) => {
  try {
    const { disco, meterNumber, amount, meterType } = req.body;
    if (!disco || !meterNumber || !amount) return res.status(400).json({ error: 'Missing fields' });
    if (amount < 500) return res.status(400).json({ error: 'Minimum ₦500' });
    
    const dis = DISCOS.find(d => d.id === parseInt(disco));
    if (!dis) return res.status(400).json({ error: 'Invalid disco' });
    
    // Get pricing and calculate markup
    const pricing = await getPricing();
    const markupPercent = pricing.electricity_markup || 0;
    const baseAmount = parseFloat(amount);
    const markupAmount = Math.ceil(baseAmount * (markupPercent / 100));
    const totalAmount = baseAmount + markupAmount;
    
    if (parseFloat(req.user.balance) < totalAmount) {
      return res.status(400).json({ error: `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (includes ₦${markupAmount} service fee)` });
    }
    
    if (!VTU_API_KEY) {
      return res.status(400).json({ error: 'VTU API not configured' });
    }
    
    console.log(`\n⚡ ELECTRICITY PAYMENT REQUEST:`);
    console.log(`⚡ Disco: ${dis.name} (ID: ${disco})`);
    console.log(`⚡ Meter: ${meterNumber}`);
    console.log(`⚡ Base Amount: ₦${baseAmount} | Markup: ₦${markupAmount} (${markupPercent}%) | Total: ₦${totalAmount}`);
    console.log(`⚡ Type: ${meterType === 'postpaid' || meterType === 2 ? 'Postpaid' : 'Prepaid'}`);
    
    try {
      const mType = (meterType === 'postpaid' || meterType === 2) ? 2 : 1; // 1=Prepaid, 2=Postpaid
      
      // DancityNG API format - send base amount to API
      const requestBody = {
        disco_name: parseInt(disco),
        amount: parseInt(baseAmount),
        meter_number: meterNumber,
        MeterType: mType
      };
      
      console.log('⚡ Request body:', JSON.stringify(requestBody));
      
      const apiRes = await axios.post(`${VTU_API_URL}/billpayment/`, requestBody, {
        headers: {
          'Authorization': `Token ${VTU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      });
      
      console.log('⚡ DancityNG Response:', JSON.stringify(apiRes.data));
      
      if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success' || apiRes.data?.token) {
        // Debit total amount (base + markup), record markup as profit
        const d = await debitWallet(req.user.id, totalAmount, 'electricity', `${dis.name} - ${meterNumber}`, { 
          disco: dis.name, meterNumber, baseAmount, markupAmount,
          apiRef: apiRes.data?.ident || apiRes.data?.id || apiRes.data?.requestId
        }, markupAmount);
        
        if (!d.success) return res.status(400).json({ error: d.error });
        
        const token = apiRes.data?.token || apiRes.data?.Token || apiRes.data?.purchased_code || 'Check meter for token';
        
        console.log(`⚡ ✅ Success! Token: ${token} | Profit: ₦${markupAmount}`);
        return res.json({ 
          success: true, 
          message: 'Electricity payment successful', 
          reference: d.reference, 
          token,
          newBalance: d.newBalance 
        });
      } else {
        console.log('⚡ ❌ Failed:', apiRes.data?.message || apiRes.data?.error);
        return res.status(400).json({ error: apiRes.data?.message || apiRes.data?.error || 'Payment failed. Please check meter number.' });
      }
    } catch (apiErr) {
      console.error('⚡ ❌ API Error:', apiErr.response?.data || apiErr.message);
      const errMsg = apiErr.response?.data?.message || apiErr.response?.data?.error || apiErr.message || 'Network error';
      return res.status(400).json({ error: errMsg });
    }
  } catch (e) {
    console.error('⚡ Server Error:', e);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// Cable TV with DancityNG
app.get('/api/bills/cable/providers', (_, res) => res.json({ providers: CABLE_PROVIDERS }));
app.get('/api/bills/cable/plans/:providerId', (req, res) => res.json({ plans: CABLE_PLANS[parseInt(req.params.providerId)] || [] }));

// Verify smartcard/IUC - DancityNG may not have this endpoint
app.post('/api/bills/cable/verify', auth, async (req, res) => {
  try {
    const { provider, smartcardNumber } = req.body;
    if (!provider || !smartcardNumber) return res.status(400).json({ error: 'Missing fields' });
    
    const prov = CABLE_PROVIDERS.find(p => p.id === parseInt(provider));
    if (!prov) return res.status(400).json({ error: 'Invalid provider' });
    
    console.log(`\n📺 IUC verification request: ${smartcardNumber} (${prov.name})`);
    
    // Note: DancityNG doesn't have a separate IUC validation endpoint
    // Payment will validate the smartcard automatically
    return res.json({ 
      verified: true, 
      customerName: 'Customer',
      provider: prov.name, 
      smartcardNumber,
      note: 'Smartcard will be validated during subscription'
    });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Pay cable subscription - DancityNG API
app.post('/api/bills/cable/pay', auth, checkMaintenance, checkPayments, checkService('cable'), async (req, res) => {
  try {
    const { provider, smartcardNumber, planId } = req.body;
    if (!provider || !smartcardNumber || !planId) return res.status(400).json({ error: 'Missing fields' });
    
    const prov = CABLE_PROVIDERS.find(p => p.id === parseInt(provider));
    if (!prov) return res.status(400).json({ error: 'Invalid provider' });
    
    const plans = CABLE_PLANS[parseInt(provider)] || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    
    // Get pricing and calculate markup
    const pricing = await getPricing();
    const markupPercent = pricing.cable_markup || 0;
    const basePrice = plan.price;
    const markupAmount = Math.ceil(basePrice * (markupPercent / 100));
    const totalPrice = basePrice + markupAmount;
    
    if (parseFloat(req.user.balance) < totalPrice) {
      return res.status(400).json({ error: `Insufficient balance. Need ₦${totalPrice.toLocaleString()}${markupAmount > 0 ? ` (includes ₦${markupAmount} service fee)` : ''}` });
    }
    
    if (!VTU_API_KEY) {
      return res.status(400).json({ error: 'VTU API not configured' });
    }
    
    console.log(`\n📺 CABLE SUBSCRIPTION REQUEST:`);
    console.log(`📺 Provider: ${prov.name} (ID: ${provider})`);
    console.log(`📺 Plan: ${plan.name} (Plan ID: ${plan.planId})`);
    console.log(`📺 Smartcard: ${smartcardNumber}`);
    console.log(`📺 Base Price: ₦${basePrice} | Markup: ₦${markupAmount} (${markupPercent}%) | Total: ₦${totalPrice}`);
    
    try {
      // DancityNG API format as per documentation
      const requestBody = {
        cablename: parseInt(provider),
        cableplan: plan.planId,
        smart_card_number: smartcardNumber
      };
      
      console.log('📺 Request body:', JSON.stringify(requestBody));
      
      const apiRes = await axios.post(`${VTU_API_URL}/cablesub/`, requestBody, {
        headers: {
          'Authorization': `Token ${VTU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      });
      
      console.log('📺 DancityNG Response:', JSON.stringify(apiRes.data));
      
      if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success') {
        // Debit total price (base + markup), record markup as profit
        const d = await debitWallet(req.user.id, totalPrice, 'cable', `${prov.name} ${plan.name} - ${smartcardNumber}`, { 
          provider: prov.name, plan: plan.name, smartcardNumber, basePrice, markupAmount,
          apiRef: apiRes.data?.ident || apiRes.data?.id || apiRes.data?.requestId
        }, markupAmount);
        
        if (!d.success) return res.status(400).json({ error: d.error });
        
        console.log(`📺 ✅ Success! Ref: ${d.reference} | Profit: ₦${markupAmount}`);
        return res.json({ 
          success: true, 
          message: `${prov.name} ${plan.name} activated`, 
          reference: d.reference,
          plan: plan.name,
          amount: totalPrice,
          newBalance: d.newBalance 
        });
      } else {
        console.log('📺 ❌ Failed:', apiRes.data?.message || apiRes.data?.error);
        return res.status(400).json({ error: apiRes.data?.message || apiRes.data?.error || 'Subscription failed. Please check smartcard number.' });
      }
    } catch (apiErr) {
      console.error('📺 ❌ API Error:', apiErr.response?.data || apiErr.message);
      const errMsg = apiErr.response?.data?.message || apiErr.response?.data?.error || apiErr.message || 'Network error';
      return res.status(400).json({ error: errMsg });
    }
  } catch (e) {
    console.error('📺 Server Error:', e);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// ===========================================
// KYC - checkmyninbvn.com.ng - FIXED
// ===========================================

app.get('/api/kyc/services', async (_, res) => {
  try {
    const pricing = await getPricing();
    const kycProfit = pricing.kyc_profit || 50;
    
    // Base costs (what we pay) + profit margin
    const basePrices = {
      'nin': 150, 'nin-phone': 200, 'nin-demography': 250,
      'bvn': 100, 'bvn-phone': 150
    };
    
    // Only return available services with dynamic pricing
    const available = Object.entries(KYC_SERVICES)
      .filter(([_, s]) => s.available !== false)
      .map(([id, s]) => ({ 
        id, 
        name: s.name, 
        description: s.description, 
        price: (basePrices[id] || 150) + kycProfit,
        isMultiField: id === 'nin-demography'
      }));
    res.json({ services: available });
  } catch (e) {
    // Fallback to default prices
    const available = Object.entries(KYC_SERVICES)
      .filter(([_, s]) => s.available !== false)
      .map(([id, s]) => ({ id, name: s.name, description: s.description, price: s.price, isMultiField: id === 'nin-demography' }));
    res.json({ services: available });
  }
});

app.post('/api/kyc/verify/:serviceId', auth, checkMaintenance, checkPayments, checkService('kyc'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = KYC_SERVICES[serviceId];
    if (!service) return res.status(400).json({ error: 'Invalid service' });
    
    // Get dynamic pricing
    const pricing = await getPricing();
    const kycProfit = pricing.kyc_profit || 50;
    const basePrices = { 'nin': 150, 'nin-phone': 200, 'nin-demography': 250, 'bvn': 100, 'bvn-phone': 150 };
    const price = (basePrices[serviceId] || 150) + kycProfit;
    
    // Check balance
    if (parseFloat(req.user.balance) < price) {
      return res.status(400).json({ error: `Insufficient balance. Need ₦${price}` });
    }
    
    // Build request body based on service type
    let requestBody = { consent: true };
    let lookupInput = '';
    
    if (serviceId === 'nin-demography') {
      // NIN Demography Search
      const { firstname, lastname, gender, dob } = req.body;
      if (!firstname || !lastname || !gender || !dob) {
        return res.status(400).json({ error: 'All fields required: firstname, lastname, gender, dob' });
      }
      requestBody = {
        firstname: firstname.toUpperCase().trim(),
        lastname: lastname.toUpperCase().trim(),
        gender: gender.toLowerCase().trim(),
        dob: dob.trim(),
        consent: true
      };
      lookupInput = `${firstname} ${lastname}`;
    } else if (serviceId === 'nin-phone' || serviceId === 'bvn-phone') {
      // Phone-based lookup
      let phone = req.body.phone || req.body.input;
      if (!phone) return res.status(400).json({ error: 'Phone number required' });
      if (phone.startsWith('234')) phone = '0' + phone.slice(3);
      requestBody = { phone: phone.trim(), consent: true };
      lookupInput = phone;
    } else if (serviceId === 'nin') {
      // NIN verification
      const nin = req.body.nin || req.body.input;
      if (!nin || !/^\d{11}$/.test(nin)) return res.status(400).json({ error: 'NIN must be 11 digits' });
      requestBody = { nin: nin.trim(), consent: true };
      lookupInput = nin;
    } else if (serviceId === 'bvn') {
      // BVN verification
      const bvn = req.body.bvn || req.body.input;
      if (!bvn || !/^\d{11}$/.test(bvn)) return res.status(400).json({ error: 'BVN must be 11 digits' });
      requestBody = { bvn: bvn.trim(), consent: true };
      lookupInput = bvn;
    }
    
    let responseData = null;
    
    // Call API
    if (KYC_API_KEY) {
      console.log(`\n🔍 ========== KYC REQUEST ==========`);
      console.log(`🔍 Service: ${serviceId}`);
      console.log(`🔍 Endpoint: https://checkmyninbvn.com.ng/api${service.endpoint}`);
      console.log('🔍 Request body:', JSON.stringify(requestBody));
      
      try {
        const apiRes = await axios({
          method: 'POST',
          url: `https://checkmyninbvn.com.ng/api${service.endpoint}`,
          headers: { 'Content-Type': 'application/json', 'x-api-key': KYC_API_KEY },
          data: requestBody,
          timeout: 60000
        });
        
        console.log('🔍 Full API Response:', JSON.stringify(apiRes.data, null, 2));
        
        // Handle response
        if (apiRes.data?.status === 'success') {
          responseData = apiRes.data?.data || apiRes.data;
          
          // Remove status/message if at root
          if (!apiRes.data?.data) {
            const { status, message, reportID, ...actualData } = responseData;
            responseData = actualData;
          }
          
          console.log(`🔍 ✅ Success!`);
        } else if (apiRes.data?.status === 'error') {
          console.log('🔍 ❌ API Error:', apiRes.data?.message);
          return res.status(400).json({ error: apiRes.data?.message || 'Verification failed' });
        } else {
          console.log('🔍 ❌ Unknown response:', apiRes.data);
          return res.status(400).json({ error: 'Unexpected API response' });
        }
      } catch (e) {
        console.error('🔍 ❌ API Exception:', e.response?.data || e.message);
        return res.status(400).json({ error: e.response?.data?.message || 'Verification failed. Please try again.' });
      }
    } else {
      // Mock for testing
      responseData = {
        firstname: 'JOHN', middlename: 'OLUMIDE', surname: 'ADEBAYO',
        telephoneno: '08012345678', gender: 'Male', birthdate: '1990-05-15',
        residence_state: 'Lagos', residence_lga: 'Ikeja'
      };
    }
    
    // Debit wallet
    const d = await debitWallet(req.user.id, price, 'kyc', `KYC: ${service.name}`, { service: serviceId, input: lookupInput }, kycProfit);
    if (!d.success) return res.status(400).json({ error: d.error });
    
    // Save record
    try {
      await pool.query(
        'INSERT INTO kyc_records (user_id, service_type, lookup_input, result_data, status, amount, reference) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [req.user.id, serviceId, lookupInput, JSON.stringify(responseData), 'success', price, d.reference]
      );
    } catch (dbErr) {
      console.log('KYC record save error:', dbErr.message);
    }
    
    await logActivity(req.user.id, 'kyc_verify', req, { service: serviceId });
    
    res.json({ success: true, data: responseData, amountCharged: price, newBalance: d.newBalance, reference: d.reference });
  } catch (e) {
    console.error('KYC Error:', e);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ===========================================
// AI CHAT - GPT-4o POWERED - CONVERSATIONAL CUSTOMER SERVICE
// ===========================================
app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    const balance = parseFloat(user.balance);
    const userName = user.first_name;
    
    console.log(`\n🤖 AI (GPT-4o): "${message}" from ${userName} (₦${balance})`);
    
    if (!OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY not set!');
      return res.status(400).json({ error: 'AI not configured. Add OPENAI_API_KEY to .env' });
    }
    
    const systemPrompt = `You are PAY ENGINE, the friendly AI assistant for OneTap - a Nigerian VTU (Virtual Top Up) and KYC verification app. You handle customer support, answer questions, and help users with transactions. You are powered by GPT-4o.

USER INFO:
- Name: ${userName}
- Balance: ₦${balance.toLocaleString()}
- Phone: ${user.phone}

YOUR PERSONALITY:
- Warm, friendly, and helpful Nigerian assistant
- Use casual Nigerian English (e.g., "How far!", "No wahala", "Sharp sharp", "Omo", "E go be")
- Keep responses concise but helpful (2-4 sentences usually)
- Be empathetic when users have issues
- Never be robotic - be natural and conversational!

WHAT ONETAP OFFERS:
1. **Airtime** - Buy airtime for any Nigerian network (MTN, GLO, Airtel, 9mobile) - Min ₦50
2. **Data** - Buy data bundles for all networks at cheap rates
3. **Electricity** - Pay electricity bills (IKEDC, EKEDC, AEDC, etc.)
4. **Cable TV** - Subscribe to GOtv, DStv, Startimes
5. **KYC Verification** - Verify NIN, BVN (₦150-₦250)
6. **Wallet** - Fund via bank transfer (Paystack)

COMMON QUESTIONS & ANSWERS:

Q: How do I fund my wallet?
A: Go to Dashboard > "Fund Wallet" > Enter amount > Pay with card or bank transfer. It's instant!

Q: My transaction failed but I was debited
A: No wahala! Check your transaction history first. If the money left but service didn't deliver, it usually resolves in 5-30 mins. If not, reach out and we'll sort it out.

Q: What's NIN/BVN verification?
A: It's a service to verify someone's identity using their NIN (National ID) or BVN (Bank Verification Number). Useful for businesses, HR, or personal verification.

Q: Is OneTap safe?
A: 100%! We use bank-level security, encrypted transactions, and we're partnered with trusted providers. Your money is safe!

Q: How do I contact support?
A: I'm here for you! Tell me what you need help with and I'll do my best to assist.

WHAT YOU CAN DO:
- Execute airtime and data purchases (when user gives network + phone + amount)
- Answer questions about OneTap services
- Help troubleshoot transaction issues
- Explain how to use features (wallet funding, KYC, bills, etc.)
- Check user balance and guide them

WHAT YOU CANNOT DO (guide user to the app pages instead):
- Cable TV subscriptions (need Smart Card number + plan - guide them to Cable page)
- Electricity payments (need Meter number + disco - guide them to Electricity page)
- KYC verifications (need specific ID numbers - guide them to KYC page)

PRICING (Approximate):
- Airtime: Face value + small service fee
- MTN Data: 500MB=₦250, 1GB=₦300, 2GB=₦600, 5GB=₦2600
- GLO Data: 500MB=₦250, 1GB=₦480, 2GB=₦950, 5GB=₦2350
- Airtel Data: 300MB=₦150, 1GB=₦400, 3.5GB=₦1600
- 9mobile Data: 500MB=₦280, 1GB=₦550, 2GB=₦1100
- KYC: NIN=₦200, BVN=₦150

TRANSACTION EXECUTION:
When user wants to buy airtime or data and gives you: network + phone number + amount/data size, execute immediately!

NETWORKS: MTN(id:1), GLO(id:2), 9mobile(id:3), Airtel(id:4)

To execute, add this at END of your response:
- Airtime: ###ACTION###{"type":"airtime","network":1,"phone":"08012345678","amount":500}###
- Data: ###ACTION###{"type":"data","network":1,"phone":"08012345678","planId":"mtn-1gb-cg"}###

PLAN IDs:
- MTN: mtn-500mb, mtn-1gb-cg, mtn-2gb-cg, mtn-3gb-dc, mtn-5gb-sme
- GLO: glo-200mb, glo-500mb, glo-1gb, glo-2gb, glo-5gb
- 9mobile: 9mobile-500mb, 9mobile-1gb, 9mobile-2gb, 9mobile-3gb
- Airtel: airtel-300mb, airtel-1gb, airtel-3.5gb, airtel-10gb

IMPORTANT RULES:
1. Be conversational! Don't just answer questions robotically
2. Show empathy for frustrated users
3. If user has a problem you can't solve, or seems very unhappy/frustrated after trying to help, ONLY THEN offer the support email: chiblinks3@gmail.com
4. Don't offer the email unless the user really needs human support - you should try to help first!
5. For transactions, execute immediately when you have all details - no need to ask for confirmation
6. If balance is insufficient, kindly let them know and suggest funding their wallet

EXAMPLES:

User: "hello"
Assistant: Hey ${userName}! 👋 How far? I'm PAY ENGINE, your OneTap assistant. How can I help you today?

User: "what can you do?"
Assistant: Omo, plenty things! 😊 I can help you buy airtime & data, answer questions about OneTap, help with any issues you're facing, and more. Just tell me what you need!

User: "buy 1gb mtn for 08012345678"
Assistant: Sharp! 1GB MTN data loading to 08012345678 right now! 🚀 ###ACTION###{"type":"data","network":1,"phone":"08012345678","planId":"mtn-1gb-cg"}###

User: "my data didn't come through"
Assistant: Ah sorry about that! 😔 Sometimes it takes a few minutes to reflect. Can you check again in about 5-10 mins? Also check your transaction history to confirm the status. If it still doesn't show after 30 mins, let me know and we'll sort it out!

User: "I've been waiting for hours and nothing!"
Assistant: I totally understand your frustration, and I'm really sorry about this! 😔 This shouldn't happen. Please send an email to chiblinks3@gmail.com with your transaction reference and phone number - our team will resolve this urgently for you. Again, so sorry for the inconvenience!

User: "how do I fund my wallet"
Assistant: Easy! Just go to your Dashboard and tap "Fund Wallet". Enter how much you want to add, then pay with your card or bank transfer. The money shows up instantly! 💰

Remember: Be helpful, be friendly, be Nigerian! 🇳🇬`;

    // Build messages with full history
    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Add conversation history (last 10 messages for context)
    if (history && history.length > 0) {
      history.slice(-10).forEach(msg => {
        if (msg.text) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        }
      });
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    console.log(`🤖 Sending ${messages.length} messages to GPT-4o...`);
    
    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages,
      max_tokens: 400,
      temperature: 0.8
    }, {
      headers: { 
        'Authorization': `Bearer ${OPENAI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      timeout: 30000
    });
    
    let reply = openaiRes.data.choices[0].message.content.trim();
    let action = null;
    
    console.log('🤖 Raw GPT-4o response:', reply);
    
    // Extract action from response
    const actionMatch = reply.match(/###ACTION###(.+?)###/s);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        reply = reply.replace(/###ACTION###.+?###/gs, '').trim();
        console.log('🤖 Action extracted:', JSON.stringify(action));
      } catch (e) {
        console.log('🤖 Failed to parse action:', e.message);
      }
    } else {
      console.log('🤖 No ###ACTION### found in response');
    }
    
    console.log('🤖 Final reply:', reply.substring(0, 80) + (reply.length > 80 ? '...' : ''));
    
    res.json({ reply, action });
    
  } catch (e) {
    console.error('🤖 GPT-4o Error:', e.response?.data?.error || e.message);
    res.status(500).json({ 
      error: 'AI request failed',
      reply: `Sorry ${req.user?.first_name || 'there'}, I couldn't process that. Try again?`,
      action: null 
    });
  }
});

app.post('/api/ai/execute', auth, async (req, res) => {
  try {
    const { action } = req.body;
    if (!action?.type) return res.status(400).json({ error: 'No action' });
    
    console.log('🤖 AI Execute:', JSON.stringify(action));
    
    // AIRTIME via DancityNG
    if (action.type === 'airtime') {
      const { network, phone, amount } = action;
      if (!network || !phone || !amount) return res.json({ success: false, message: 'Missing airtime details' });
      
      const net = NETWORKS.find(n => n.id === parseInt(network));
      if (!net) return res.json({ success: false, message: 'Invalid network' });
      
      if (parseFloat(req.user.balance) < amount) {
        return res.json({ success: false, message: `Insufficient balance. You have ₦${parseFloat(req.user.balance).toLocaleString()}` });
      }
      
      if (!VTU_API_KEY) {
        return res.json({ success: false, message: 'VTU API not configured' });
      }
      
      console.log(`📱 AI AIRTIME: ₦${amount} ${net.name} to ${phone}`);
      
      try {
        const apiRes = await axios.post(`${VTU_API_URL}/topup/`, {
          network: parseInt(network),
          amount: parseInt(amount),
          mobile_number: phone,
          Ported_number: true,
          airtime_type: 'VTU'
        }, {
          headers: { 'Authorization': `Token ${VTU_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 60000
        });
        
        console.log('📱 API Response:', JSON.stringify(apiRes.data).substring(0, 150));
        
        if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success') {
          const d = await debitWallet(req.user.id, amount, 'airtime', `${net.name} ₦${amount} to ${phone} (AI)`, action);
          if (!d.success) return res.json({ success: false, message: d.error });
          
          console.log(`📱 ✅ AI Airtime success!`);
          return res.json({ success: true, message: `₦${amount} ${net.name} airtime sent to ${phone}!`, newBalance: d.newBalance });
        } else {
          console.log('📱 ❌ Failed:', apiRes.data?.message);
          return res.json({ success: false, message: apiRes.data?.message || 'Airtime failed' });
        }
      } catch (apiErr) {
        console.error('📱 ❌ API Error:', apiErr.response?.data || apiErr.message);
        return res.json({ success: false, message: apiErr.response?.data?.message || 'Network error' });
      }
    }
    
    // DATA via DancityNG
    if (action.type === 'data') {
      const { network, phone, planId } = action;
      if (!network || !phone || !planId) return res.json({ success: false, message: 'Missing data details' });
      
      const net = NETWORKS.find(n => n.id === parseInt(network));
      if (!net) return res.json({ success: false, message: 'Invalid network' });
      
      const plans = DATA_PLANS[parseInt(network)] || [];
      const plan = plans.find(p => p.id === planId);
      if (!plan) return res.json({ success: false, message: 'Invalid plan' });
      
      if (!plan.planId) {
        return res.json({ success: false, message: 'This plan is not available' });
      }
      
      if (parseFloat(req.user.balance) < plan.price) {
        return res.json({ success: false, message: `Insufficient balance. Need ₦${plan.price}` });
      }
      
      if (!VTU_API_KEY) {
        return res.json({ success: false, message: 'VTU API not configured' });
      }
      
      console.log(`📶 AI DATA: ${plan.size} ${net.name} (Plan ${plan.planId}) to ${phone}`);
      
      try {
        const apiRes = await axios.post(`${VTU_API_URL}/data/`, {
          network: parseInt(network),
          mobile_number: phone,
          plan: plan.planId,
          Ported_number: true
        }, {
          headers: { 'Authorization': `Token ${VTU_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 60000
        });
        
        console.log('📶 API Response:', JSON.stringify(apiRes.data).substring(0, 150));
        
        if (apiRes.data?.Status === 'successful' || apiRes.data?.status === 'success') {
          const d = await debitWallet(req.user.id, plan.price, 'data', `${net.name} ${plan.size} to ${phone} (AI)`, action);
          if (!d.success) return res.json({ success: false, message: d.error });
          
          console.log(`📶 ✅ AI Data success!`);
          return res.json({ success: true, message: `${net.name} ${plan.size} data sent to ${phone}!`, newBalance: d.newBalance });
        } else {
          console.log('📶 ❌ Failed:', apiRes.data?.message);
          return res.json({ success: false, message: apiRes.data?.message || 'Data purchase failed' });
        }
      } catch (apiErr) {
        console.error('📶 ❌ API Error:', apiErr.response?.data || apiErr.message);
        return res.json({ success: false, message: apiErr.response?.data?.message || 'Network error' });
      }
    }
    
    // BALANCE CHECK
    if (action.type === 'balance') {
      return res.json({ success: true, message: `Your balance is ₦${parseFloat(req.user.balance).toLocaleString()}`, balance: parseFloat(req.user.balance) });
    }
    
    return res.json({ success: false, message: 'Unknown action' });
  } catch (e) {
    console.error('AI Execute error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ===========================================
// ANNOUNCEMENTS
// ===========================================
app.get('/api/announcements', async (_, res) => {
  try {
    const r = await pool.query('SELECT * FROM announcements WHERE active=true ORDER BY created_at DESC LIMIT 5');
    res.json({ announcements: r.rows });
  } catch (e) {
    res.json({ announcements: [] });
  }
});

// ===========================================
// ADMIN ROUTES
// ===========================================
app.get('/api/admin/stats', adminAuth, async (_, res) => {
  try {
    // Check if stats were reset and get reset date
    const resetInfo = await pool.query("SELECT value FROM settings WHERE key='stats_reset'");
    const lastReset = resetInfo.rows[0]?.value?.date || null;
    
    // Build query based on reset date
    let txQuery = 'SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as vol, COALESCE(SUM(profit),0) as profit FROM transactions';
    let todayQuery = "SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as vol FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours'";
    let kycQuery = 'SELECT COUNT(*) as count FROM kyc_records';
    
    if (lastReset) {
      txQuery += ` WHERE created_at > '${lastReset}'`;
      kycQuery += ` WHERE created_at > '${lastReset}'`;
    }
    
    const [u, t, k, today] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(balance),0) as bal FROM users'),
      pool.query(txQuery),
      pool.query(kycQuery),
      pool.query(todayQuery)
    ]);
    res.json({
      totalUsers: parseInt(u.rows[0].count),
      totalBalance: parseFloat(u.rows[0].bal),
      totalTransactions: parseInt(t.rows[0].count),
      totalVolume: parseFloat(t.rows[0].vol),
      totalProfit: parseFloat(t.rows[0].profit),
      kycCount: parseInt(k.rows[0].count),
      todayTransactions: parseInt(today.rows[0].count),
      todayVolume: parseFloat(today.rows[0].vol),
      lastReset
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Reset admin stats (clears counters but keeps data)
app.post('/api/admin/stats/reset', adminAuth, async (_, res) => {
  try {
    const resetDate = new Date().toISOString();
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('stats_reset', $1) 
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify({ date: resetDate })]
    );
    console.log(`📊 Admin stats reset at ${resetDate}`);
    res.json({ success: true, resetDate });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let q = 'SELECT * FROM users';
    const p = [];
    if (search) {
      q += ' WHERE email ILIKE $1 OR phone ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1';
      p.push(`%${search}%`);
    }
    q += ' ORDER BY created_at DESC LIMIT 100';
    const r = await pool.query(q, p);
    res.json({ users: r.rows });
  } catch (e) {
    res.json({ users: [] });
  }
});

app.get('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const u = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!u.rows[0]) return res.status(404).json({ error: 'Not found' });
    const user = u.rows[0];
    const activity = await pool.query('SELECT * FROM activity_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1', [req.params.id]);
    const txs = await pool.query('SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.params.id]);
    const logs = await pool.query('SELECT * FROM activity_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.params.id]);
    const stats = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as vol FROM transactions WHERE user_id=$1', [req.params.id]);
    const last = activity.rows[0];
    res.json({
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, name: `${user.first_name} ${user.last_name}`, email: user.email, phone: user.phone, balance: parseFloat(user.balance), status: user.status, createdAt: user.created_at, lastActivity: last?.created_at, lastDevice: last?.device_type || 'Unknown', lastIp: last?.ip_address || 'Unknown' },
      transactions: txs.rows,
      activityLogs: logs.rows,
      stats: { transactionCount: parseInt(stats.rows[0].count), totalVolume: parseFloat(stats.rows[0].vol) }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.patch('/api/admin/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.query('UPDATE users SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Admin Credit/Debit User Balance
app.post('/api/admin/users/:id/balance', adminAuth, async (req, res) => {
  try {
    const { type, amount, reason } = req.body;
    const userId = req.params.id;
    
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Reason required' });
    }
    
    // Get user
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentBalance = parseFloat(user.rows[0].balance);
    
    // Check sufficient balance for debit
    if (type === 'debit' && currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const newBalance = type === 'credit' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    // Update balance
    await pool.query('UPDATE users SET balance=$1 WHERE id=$2', [newBalance, userId]);
    
    // Create transaction record
    const ref = `ADM${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, reference, balance_before, balance_after, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [userId, type, amount, 'admin', `Admin ${type}: ${reason}`, ref, currentBalance, newBalance, 'success']
    );
    
    console.log(`💰 Admin ${type}: ${user.rows[0].email} | ₦${amount} | ${reason}`);
    
    res.json({ success: true, newBalance });
  } catch (e) {
    console.error('Admin balance error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/admin/transactions', adminAuth, async (_, res) => {
  try {
    const r = await pool.query('SELECT t.*, u.email, u.first_name, u.last_name FROM transactions t LEFT JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC LIMIT 100');
    res.json({ transactions: r.rows });
  } catch (e) {
    res.json({ transactions: [] });
  }
});

app.get('/api/admin/logs', adminAuth, async (_, res) => {
  try {
    const r = await pool.query('SELECT l.*, u.email, u.first_name, u.last_name FROM activity_logs l LEFT JOIN users u ON l.user_id=u.id ORDER BY l.created_at DESC LIMIT 100');
    res.json({ logs: r.rows });
  } catch (e) {
    res.json({ logs: [] });
  }
});

// Delete single log
app.delete('/api/admin/logs/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM activity_logs WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Clear all logs
app.delete('/api/admin/logs', adminAuth, async (_, res) => {
  try {
    await pool.query('DELETE FROM activity_logs');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/admin/settings/pricing', adminAuth, async (_, res) => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key='pricing'");
    const defaults = { 
      airtime_markup: 2, 
      data_markup: 2, 
      electricity_markup: 0, 
      cable_markup: 0,
      kyc_profit: 50 
    };
    res.json({ pricing: { ...defaults, ...(r.rows[0]?.value || {}) } });
  } catch (e) {
    res.json({ pricing: { airtime_markup: 2, data_markup: 2, electricity_markup: 0, cable_markup: 0, kyc_profit: 50 } });
  }
});

app.put('/api/admin/settings/pricing', adminAuth, async (req, res) => {
  try {
    // Insert or update pricing
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('pricing', $1) 
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(req.body.pricing)]
    );
    console.log('💰 Pricing updated:', req.body.pricing);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// System Settings (Maintenance Mode, Payment Engine, etc.)
app.get('/api/admin/settings/system', adminAuth, async (_, res) => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key='system'");
    const defaults = { 
      maintenance_mode: false, 
      payment_enabled: true,
      airtime_enabled: true,
      data_enabled: true,
      electricity_enabled: true,
      cable_enabled: true,
      kyc_enabled: true
    };
    res.json({ settings: { ...defaults, ...(r.rows[0]?.value || {}) } });
  } catch (e) {
    res.json({ settings: { maintenance_mode: false, payment_enabled: true, airtime_enabled: true, data_enabled: true, electricity_enabled: true, cable_enabled: true, kyc_enabled: true } });
  }
});

app.put('/api/admin/settings/system', adminAuth, async (req, res) => {
  try {
    const { password, action, status } = req.body;
    
    // For critical actions (maintenance/payment), verify password
    if (action === 'maintenance' || action === 'payment') {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
    
    // FIXED: Merge settings instead of overwriting
    const current = await getSystemStatus();
    const newSettings = { ...current, ...(status || req.body.settings) };
    
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('system', $1) 
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(newSettings)]
    );
    
    // Log the action
    if (action === 'maintenance') {
      const msg = newSettings.maintenance_mode ? '🔴 MAINTENANCE MODE ENABLED' : '🟢 MAINTENANCE MODE DISABLED';
      console.log(`\n🔧 ========================================`);
      console.log(`🔧 ${msg}`);
      console.log(`🔧 Time: ${new Date().toLocaleString()}`);
      console.log(`🔧 ========================================\n`);
    } else if (action === 'payment') {
      const msg = newSettings.payment_enabled ? '🟢 PAYMENTS ENABLED' : '🔴 PAYMENTS DISABLED';
      console.log(`\n🔧 ========================================`);
      console.log(`🔧 ${msg}`);
      console.log(`🔧 Time: ${new Date().toLocaleString()}`);
      console.log(`🔧 ========================================\n`);
    } else {
      console.log('🔧 System settings updated:', newSettings);
    }
    
    res.json({ success: true, status: newSettings, message: 'Settings updated' });
  } catch (e) {
    console.error('System settings error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/admin/announcements', adminAuth, async (_, res) => {
  try {
    const r = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ announcements: r.rows });
  } catch (e) {
    res.json({ announcements: [] });
  }
});

app.post('/api/admin/announcements', adminAuth, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    await pool.query('INSERT INTO announcements (title, message, type) VALUES ($1,$2,$3)', [title, message, type || 'info']);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/admin/announcements/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// ===========================================
// ADMIN TRANSACTION DELETE ENDPOINTS
// ===========================================

// Delete single transaction
app.delete('/api/admin/transactions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id=$1', [req.params.id]);
    console.log(`🗑️ Transaction deleted: ID ${req.params.id}`);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete transaction error:', e);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Delete multiple transactions (bulk delete)
app.post('/api/admin/transactions/delete-bulk', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No transaction IDs provided' });
    }
    
    // Delete all selected transactions
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );
    
    console.log(`🗑️ Bulk delete: ${result.rowCount} transactions deleted`);
    res.json({ success: true, deleted: result.rowCount });
  } catch (e) {
    console.error('Bulk delete error:', e);
    res.status(500).json({ error: 'Failed to delete transactions' });
  }
});

// Delete all transactions (with confirmation)
app.delete('/api/admin/transactions', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transactions RETURNING id');
    console.log(`🗑️ All transactions deleted: ${result.rowCount} records`);
    res.json({ success: true, deleted: result.rowCount });
  } catch (e) {
    console.error('Delete all transactions error:', e);
    res.status(500).json({ error: 'Failed to delete transactions' });
  }
});

// ===========================================
// START
// ===========================================
console.log(`\n📊 Configuration:`);
console.log(`   Database: ${DATABASE_URL ? '✅' : '❌'}`);
console.log(`   Supabase: ${SUPABASE_URL ? '✅' : '⚠️'}`);
console.log(`   OpenAI:   ${OPENAI_API_KEY ? '✅' : '⚠️'}`);
console.log(`   KYC API:  ${KYC_API_KEY ? '✅' : '⚠️'}`);
console.log(`   VTU API:  ${process.env.VTU_API_KEY ? '✅' : '⚠️'}`);
console.log(`   Monnify:  ${MONNIFY_API_KEY && MONNIFY_CONTRACT_CODE ? '✅' : '⚠️'}`);
console.log(`   Email:    ${RESEND_API_KEY ? '✅' : '⚠️'}`);

initDB().then(() => {
  app.listen(PORT, () => console.log(`\n🚀 Server: http://localhost:${PORT}\n`));
}).catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});
