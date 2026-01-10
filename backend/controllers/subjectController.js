import database from '../config/database.js';

export const getAllSubjects = async (req, res, next) => {
  try {
    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

export const addSubject = async (req, res, next) => {
  try {
    const { name, category, is_compulsory } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('subjects')
      .insert([{
        name,
        category,
        is_compulsory: is_compulsory || false,
      }])
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = database.getClient();
    const { error } = await supabase.from('subjects').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
