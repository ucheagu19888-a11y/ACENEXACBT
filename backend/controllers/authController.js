import database from '../config/database.js';
import tokenService from '../services/tokenService.js';

export const loginWithToken = async (req, res, next) => {
  try {
    const { token, deviceFingerprint, confirm_binding } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const tokenData = await tokenService.getTokenByCode(token);

    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid Access Token' });
    }

    if (!tokenData.is_active) {
      return res.status(403).json({ error: 'This token has been deactivated by admin' });
    }

    // Check token expiry
    const expiryCheck = await tokenService.checkTokenExpiry(tokenData);
    if (!expiryCheck.valid) {
      return res.status(403).json({ error: expiryCheck.message });
    }

    const allowedExamType = tokenData.metadata?.exam_type || 'BOTH';
    const fullName = tokenData.metadata?.full_name || 'Student';

    // Handle device binding
    if (!tokenData.device_fingerprint) {
      if (!confirm_binding) {
        return res.json({ requires_binding: true });
      }

      await tokenService.updateToken(tokenData.token_code, {
        device_fingerprint: deviceFingerprint,
      });

      // Fetch updated token with expiry
      const updatedToken = await tokenService.getTokenByCode(tokenData.token_code);
      const expiryDate = updatedToken?.expires_at
        ? new Date(updatedToken.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Unknown';

      return res.json({
        username: tokenData.token_code,
        role: 'student',
        fullName,
        regNumber: tokenData.token_code,
        isTokenLogin: true,
        allowedExamType,
        message: `Access code bound successfully! Valid until ${expiryDate}`,
        expiresAt: updatedToken?.expires_at,
      });
    }

    // Verify device match
    if (tokenData.device_fingerprint !== deviceFingerprint) {
      return res.status(403).json({
        error: 'ACCESS DENIED: This Access Code is locked to another device.'
      });
    }

    // Return success with expiry info
    return res.json({
      username: tokenData.token_code,
      role: 'student',
      fullName,
      regNumber: tokenData.token_code,
      isTokenLogin: true,
      allowedExamType,
      remainingDays: expiryCheck.remainingDays,
      expiresAt: expiryCheck.expiresAt,
      expiryMessage: expiryCheck.remainingDays
        ? `${expiryCheck.remainingDays} days remaining`
        : 'Active',
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    const supabase = database.getClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', role)
      .single();

    if (error || !user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userInfo } = user;
    res.json(userInfo);
  } catch (error) {
    next(error);
  }
};

export const updateCredentials = async (req, res, next) => {
  try {
    const { currentUsername, currentPassword, newUsername, newPassword, role } = req.body;

    const supabase = database.getClient();

    // Verify current credentials
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', currentUsername)
      .eq('role', role)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update credentials
    const { error: updateError } = await supabase
      .from('users')
      .update({ username: newUsername, password: newPassword })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const { fullName, regNumber } = req.body;

    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: regNumber,
        role: 'student',
        full_name: fullName,
        reg_number: regNumber,
        password: null,
        allowed_exam_type: 'BOTH',
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error) {
    next(error);
  }
};
