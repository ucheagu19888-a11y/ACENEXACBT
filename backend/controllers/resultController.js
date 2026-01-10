import database from '../config/database.js';

export const getStudentResults = async (req, res, next) => {
  try {
    const { username } = req.params;

    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('user_username', username)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = data.map(r => ({
      id: r.id,
      aggregateScore: r.aggregate_score,
      totalScore: r.total_score,
      subjectScores: r.subject_scores,
      timestamp: parseInt(r.timestamp),
      session: { examType: r.exam_type },
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

export const saveResult = async (req, res, next) => {
  try {
    const { username, result } = req.body;

    const dbResult = {
      user_username: username,
      exam_type: result.session.examType,
      total_score: result.totalScore,
      aggregate_score: result.aggregateScore,
      subject_scores: result.subjectScores,
      timestamp: result.timestamp.toString(),
    };

    const supabase = database.getClient();
    const { error } = await supabase.from('results').insert([dbResult]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const clearResults = async (req, res, next) => {
  try {
    const { username } = req.params;

    const supabase = database.getClient();
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('user_username', username);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
