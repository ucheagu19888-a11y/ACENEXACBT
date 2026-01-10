import tokenService from '../services/tokenService.js';

export const generateToken = async (req, res, next) => {
  try {
    const { reference, amount, examType, fullName, phoneNumber } = req.body;

    const tokenData = {
      payment_ref: reference || `MANUAL-${Date.now()}`,
      amount_paid: amount || 0,
      exam_type: examType || 'BOTH',
      full_name: fullName,
      phone_number: phoneNumber,
      generated_by: 'ADMIN',
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

export const getAllTokens = async (req, res, next) => {
  try {
    const tokens = await tokenService.getAllTokens();
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const updateTokenStatus = async (req, res, next) => {
  try {
    const { tokenCode, isActive } = req.body;

    if (!tokenCode) {
      return res.status(400).json({ error: 'Missing token code' });
    }

    await tokenService.updateToken(tokenCode, { is_active: isActive });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const resetTokenDevice = async (req, res, next) => {
  try {
    const { tokenCode } = req.body;

    if (!tokenCode) {
      return res.status(400).json({ error: 'Missing token code' });
    }

    await tokenService.updateToken(tokenCode, { device_fingerprint: null });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteToken = async (req, res, next) => {
  try {
    const { tokenCode } = req.params;
    await tokenService.deleteToken(tokenCode);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
