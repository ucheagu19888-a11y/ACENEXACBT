import database from '../config/database.js';

export const getAllQuestions = async (req, res, next) => {
  try {
    const supabase = database.getClient();
    const { data, error } = await supabase.from('questions').select('*');

    if (error) throw error;

    const mapped = data.map(q => ({
      id: q.id,
      subject: q.subject,
      examType: q.exam_type,
      text: q.text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctOption: q.correct_option,
      explanation: q.explanation,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

export const addQuestion = async (req, res, next) => {
  try {
    const q = req.body;

    const dbQuestion = {
      subject: q.subject,
      exam_type: q.examType,
      text: q.text,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_option: q.correctOption,
      explanation: q.explanation,
    };

    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('questions')
      .insert([dbQuestion])
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    next(error);
  }
};

export const addBulkQuestions = async (req, res, next) => {
  try {
    const questions = req.body;

    const dbQuestions = questions.map(q => ({
      subject: q.subject,
      exam_type: q.examType,
      text: q.text,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_option: q.correctOption,
      explanation: q.explanation,
    }));

    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('questions')
      .insert(dbQuestions)
      .select();

    if (error) throw error;

    res.json({ count: data.length });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = database.getClient();
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const resetAllQuestions = async (req, res, next) => {
  try {
    const supabase = database.getClient();
    const { error } = await supabase
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
