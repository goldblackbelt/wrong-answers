class Question {
  constructor(data) {
    this.id = data.id;
    this.content = data.content;
    this.image = data.image;
    this.answer = data.answer;
    this.explanation = data.explanation;
    this.knowledge_points = data.knowledge_points;
    this.exam_points = data.exam_points;
    this.difficulty = data.difficulty;
    this.type = data.type;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建问题
  static async create(data) {
    try {
      const { data: question, error } = await global.supabase
        .from('questions')
        .insert({
          content: data.content,
          image: data.image,
          answer: data.answer,
          explanation: data.explanation,
          knowledge_points: data.knowledgePoints || [],
          exam_points: data.examPoints || [],
          difficulty: data.difficulty || 3,
          type: data.type || 'multiple_choice',
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Question(question);
    } catch (error) {
      throw error;
    }
  }

  // 根据ID查找问题
  static async findById(id) {
    try {
      const { data: question, error } = await global.supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return new Question(question);
    } catch (error) {
      throw error;
    }
  }

  // 查找相似问题
  static async findSimilar(knowledgePoints, limit = 5) {
    try {
      // 这里简化处理，实际可能需要更复杂的相似性匹配逻辑
      const { data: questions, error } = await global.supabase
        .from('questions')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return questions.map(q => new Question(q));
    } catch (error) {
      throw error;
    }
  }

  // 更新问题
  static async update(id, data) {
    try {
      const updateData = {};
      
      if (data.content !== undefined) updateData.content = data.content;
      if (data.image !== undefined) updateData.image = data.image;
      if (data.answer !== undefined) updateData.answer = data.answer;
      if (data.explanation !== undefined) updateData.explanation = data.explanation;
      if (data.knowledgePoints !== undefined) updateData.knowledge_points = data.knowledgePoints;
      if (data.examPoints !== undefined) updateData.exam_points = data.examPoints;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.type !== undefined) updateData.type = data.type;
      
      updateData.updated_at = new Date();

      const { data: question, error } = await global.supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Question(question);
    } catch (error) {
      throw error;
    }
  }

  // 删除问题
  static async delete(id) {
    try {
      const { error } = await global.supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Question;