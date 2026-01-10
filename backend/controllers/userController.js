import database from '../config/database.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { username } = req.params;

    const supabase = database.getClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
