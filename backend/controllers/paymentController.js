import paystackService from '../services/paystackService.js';
import tokenService from '../services/tokenService.js';
import database from '../config/database.js';

export const verifyPaystack = async (req, res, next) => {
  try {
    const { reference, email, fullName, phoneNumber, examType } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Missing transaction reference' });
    }

    // Check for idempotency
    const supabase = database.getClient();
    const { data: existingToken } = await supabase
      .from('access_tokens')
      .select('token_code, is_active')
      .eq('metadata->>payment_ref', reference)
      .single();

    if (existingToken) {
      return res.json({
        success: true,
        token: existingToken.token_code,
        message: 'Payment already verified. Retrieved existing access code.',
      });
    }

    // Verify with Paystack
    const verificationData = await paystackService.verifyTransaction(reference);
    const data = verificationData.data;

    if (data.status !== 'success') {
      return res.status(400).json({
        error: 'Payment verification failed: Transaction was not successful'
      });
    }

    // Validate minimum amount
    if (data.amount < 150000) {
      return res.status(400).json({
        error: 'Payment verification failed: Invalid amount paid'
      });
    }

    // Create token
    const tokenData = {
      payment_ref: reference,
      amount_paid: data.amount / 100,
      exam_type: examType || 'BOTH',
      full_name: fullName,
      phone_number: phoneNumber,
      email: email,
      paystack_id: data.id,
      verified_at: new Date().toISOString(),
    };

    const token = await tokenService.createToken(tokenData);

    res.json({
      success: true,
      token: token.token_code
    });
  } catch (error) {
    next(error);
  }
};
