
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// --- PAYSTACK SECRET KEY ---
// Security Note: Always use environment variables for Secret Keys.
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
}

if (!paystackSecretKey) {
    console.warn("WARNING: PAYSTACK_SECRET_KEY is not set in .env. Payment verification will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER FUNCTIONS ---
const generateTokenCode = (prefix = 'EBUS') => {
    // Character set: 32 chars (Base32 friendly).
    // Removed ambiguous characters (I, 1, O, 0) to reduce user error.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    
    // We use 12 random characters for high entropy (32^12 combinations).
    // 256 (byte value) is divisible by 32 (char length), so no modulo bias exists.
    const length = 12;
    const randomBytes = crypto.randomBytes(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
        const index = randomBytes[i] % chars.length;
        result += chars[index];
    }

    // Format: PREFIX-XXXX-XXXX-XXXX (Groups of 4 for readability)
    return `${prefix}-${result.slice(0, 4)}-${result.slice(4, 8)}-${result.slice(8, 12)}`;
};

// --- API ROUTES ---

// 1. PAYMENT VERIFICATION & TOKEN GENERATION
app.post('/api/payments/verify-paystack', async (req, res) => {
    const { reference, email, fullName, phoneNumber } = req.body;

    if (!reference) {
        return res.status(400).json({ error: "Missing transaction reference." });
    }

    try {
        // STEP 1: IDEMPOTENCY CHECK
        // Check if this payment reference has already been used to generate a token.
        // This prevents Replay Attacks where a user sends the same valid reference multiple times.
        const { data: existingToken, error: searchError } = await supabase
            .from('access_tokens')
            .select('token_code, is_active')
            .eq('metadata->>payment_ref', reference)
            .single();

        if (existingToken) {
            console.log(`Payment ref ${reference} already processed. Returning existing token.`);
            return res.json({ 
                success: true, 
                token: existingToken.token_code, 
                message: "Payment already verified. Retrieved existing access code." 
            });
        }

        // STEP 2: SERVER-SIDE VERIFICATION WITH PAYSTACK
        // We verify the status directly with Paystack using our Secret Key.
        // This cannot be spoofed by the client.
        const paystackUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        const verifyRes = await axios.get(paystackUrl, {
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`
            }
        });

        const data = verifyRes.data.data;

        // STEP 3: SECURITY CHECKS
        // A. Verify Status
        if (data.status !== 'success') {
            return res.status(400).json({ error: "Payment verification failed: Transaction was not successful." });
        }

        // B. Verify Amount (Expected: N2,000 = 200000 kobo)
        const EXPECTED_AMOUNT = 200000;
        if (data.amount < EXPECTED_AMOUNT) {
            console.warn(`Fraud Alert: Payment amount ${data.amount} is less than expected ${EXPECTED_AMOUNT}`);
            return res.status(400).json({ error: "Payment verification failed: Invalid amount paid." });
        }

        // 4. Generate Access Token
        const prefix = 'EBUS';
        const tokenCode = generateTokenCode(prefix);
        
        const { data: dbData, error } = await supabase
            .from('access_tokens')
            .insert([{
                token_code: tokenCode,
                is_active: true,
                device_fingerprint: null, // Unlocked initially
                metadata: {
                    payment_ref: reference,
                    amount_paid: data.amount / 100,
                    exam_type: 'BOTH',
                    full_name: fullName,
                    phone_number: phoneNumber,
                    email: email,
                    paystack_id: data.id,
                    verified_at: new Date().toISOString()
                }
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, token: dbData.token_code });
    } catch (err) {
        console.error("Verification Error:", err.response?.data || err.message);
        res.status(500).json({ error: "Server Error: Could not verify payment." });
    }
});

// ADMIN: Manually Generate Token (Cash/Transfer)
app.post('/api/admin/generate-token', async (req, res) => {
    const { reference, amount, examType, fullName, phoneNumber } = req.body;
    console.log(`Manual Generation Request: ${fullName} (${examType})`);

    try {
        const tokenCode = generateTokenCode('EBUS');
        
        const { data, error } = await supabase
            .from('access_tokens')
            .insert([{
                token_code: tokenCode,
                is_active: true,
                device_fingerprint: null,
                metadata: {
                    payment_ref: reference || `MANUAL-${Date.now()}`,
                    amount_paid: amount || 0,
                    exam_type: examType || 'BOTH',
                    full_name: fullName,
                    phone_number: phoneNumber,
                    generated_by: 'ADMIN'
                }
            }])
            .select()
            .single();

        if (error) {
            console.error("Database Insert Error:", error.message);
            throw error;
        }

        console.log(`Token Generated: ${data.token_code}`);
        res.json({ success: true, token: data.token_code });
    } catch (err) {
        console.error("Manual Token Generation Failed:", err.message);
        res.status(500).json({ error: "Token generation failed: " + err.message });
    }
});

// ADMIN: Toggle Token Status
app.post('/api/admin/token-status', async (req, res) => {
    const { tokenCode, isActive } = req.body;
    try {
        const { error } = await supabase
            .from('access_tokens')
            .update({ is_active: isActive })
            .eq('token_code', tokenCode);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Reset Token Device Lock
app.post('/api/admin/reset-token-device', async (req, res) => {
    const { tokenCode } = req.body;
    try {
        const { error } = await supabase
            .from('access_tokens')
            .update({ device_fingerprint: null })
            .eq('token_code', tokenCode);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Get Recent Tokens
app.get('/api/admin/tokens', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('access_tokens')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. AUTHENTICATION (TOKEN & DEVICE LOCK)
app.post('/api/auth/login-with-token', async (req, res) => {
  const { token, deviceFingerprint, confirm_binding } = req.body;
  
  try {
    // A. Check if token exists
    const { data: tokenData, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('token_code', token)
      .single();

    if (error || !tokenData) {
      return res.status(401).json({ error: 'Invalid Access Token.' });
    }

    if (!tokenData.is_active) {
        return res.status(403).json({ error: 'This token has been deactivated.' });
    }

    // Determine exam type permissions
    let allowedExamType = 'BOTH'; 
    if (tokenData.metadata && tokenData.metadata.exam_type) {
        allowedExamType = tokenData.metadata.exam_type;
    }
    
    // Retrieve User Name
    const fullName = tokenData.metadata?.full_name || 'Student';

    // B. DEVICE LOCKING LOGIC
    if (!tokenData.device_fingerprint) {
        // NEW: REQUIRE CONFIRMATION BEFORE BINDING
        if (!confirm_binding) {
            return res.json({ requires_binding: true });
        }

        // First time use! Bind to this device.
        const { error: updateError } = await supabase
            .from('access_tokens')
            .update({ device_fingerprint: deviceFingerprint })
            .eq('id', tokenData.id);
        
        if (updateError) throw updateError;
        
        // Return session user
        return res.json({
            username: tokenData.token_code,
            role: 'student', 
            fullName: fullName, 
            regNumber: tokenData.token_code,
            isTokenLogin: true,
            allowedExamType
        });

    } else {
        // Subsequent use: Verify Device
        if (tokenData.device_fingerprint !== deviceFingerprint) {
            return res.status(403).json({ 
                error: '⛔ SECURITY ALERT: This Access Code is locked to another device. You cannot use it here.' 
            });
        }

        // Device Match! Log in.
        return res.json({
            username: tokenData.token_code,
            role: 'student',
            fullName: fullName,
            regNumber: tokenData.token_code,
            isTokenLogin: true,
            allowedExamType
        });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Existing Admin Login (Keep this for Admins)
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).eq('role', role).single();
    if (error || !user || user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ... (Questions/Results APIs) ...
app.get('/api/users/students', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/questions', async (req, res) => {
  const { data, error } = await supabase.from('questions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  const mapped = data.map(q => ({
    id: q.id, subject: q.subject, examType: q.exam_type, text: q.text,
    optionA: q.option_a, optionB: q.option_b, optionC: q.option_c, optionD: q.option_d,
    correctOption: q.correct_option, explanation: q.explanation
  }));
  res.json(mapped);
});

app.post('/api/questions', async (req, res) => {
  const q = req.body;
  const dbQuestion = {
    subject: q.subject, exam_type: q.examType, text: q.text,
    option_a: q.optionA, option_b: q.optionB, option_c: q.optionC, option_d: q.optionD,
    correct_option: q.correctOption, explanation: q.explanation
  };
  const { data, error } = await supabase.from('questions').insert([dbQuestion]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.post('/api/questions/bulk', async (req, res) => {
  const questions = req.body;
  const dbQuestions = questions.map(q => ({
    subject: q.subject, exam_type: q.examType, text: q.text,
    option_a: q.optionA, option_b: q.optionB, option_c: q.optionC, option_d: q.optionD,
    correct_option: q.correctOption, explanation: q.explanation
  }));
  const { data, error } = await supabase.from('questions').insert(dbQuestions).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ count: data.length });
});

app.delete('/api/questions/:id', async (req, res) => {
  const { error } = await supabase.from('questions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/questions/reset/all', async (req, res) => {
  const { error } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/results/:username', async (req, res) => {
  const { data, error } = await supabase.from('results').select('*').eq('user_username', req.params.username).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = data.map(r => ({
    id: r.id, aggregateScore: r.aggregate_score, totalScore: r.total_score,
    subjectScores: r.subject_scores, timestamp: parseInt(r.timestamp), session: { examType: r.exam_type }
  }));
  res.json(mapped);
});

app.post('/api/results', async (req, res) => {
  const { username, result } = req.body;
  const dbResult = {
    user_username: username, exam_type: result.session.examType, total_score: result.totalScore,
    aggregate_score: result.aggregateScore, subject_scores: result.subjectScores, timestamp: result.timestamp
  };
  const { error } = await supabase.from('results').insert([dbResult]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/results/:username', async (req, res) => {
  const { error } = await supabase.from('results').delete().eq('user_username', req.params.username);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- SERVE FRONTEND ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
