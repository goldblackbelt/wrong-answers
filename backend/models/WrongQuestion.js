class WrongQuestion {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.questionContent = data.question_content || data.questionContent;
    this.questionImage = data.question_image || data.questionImage;
    this.standardAnswer = data.standard_answer || data.standardAnswer;
    this.userAnswer = data.user_answer || data.userAnswer;
    this.errorReason = data.error_reason || data.errorReason;
    this.knowledgePoints = data.knowledge_points || data.knowledgePoints || [];
    this.examPoints = data.exam_points || data.examPoints || [];
    this.category = data.category;
    this.difficulty = data.difficulty;
    this.uploadDate = data.upload_date || data.uploadDate;
    this.masteryLevel = data.mastery_level || data.masteryLevel || 0;
    this.reviewCount = data.review_count || data.reviewCount || 0;
    this.lastReviewDate = data.last_review_date || data.lastReviewDate;
    this.similarQuestions = data.similar_questions || data.similarQuestions || [];
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // 创建错题
  static async create(data) {
    try {
      const { data: question, error } = await global.supabase
        .from('wrong_questions')
        .insert({
          user_id: data.userId,
          question_content: data.questionContent,
          question_image: data.questionImage,
          standard_answer: data.standardAnswer,
          user_answer: data.userAnswer,
          error_reason: data.errorReason,
          knowledge_points: data.knowledgePoints || [],
          exam_points: data.examPoints || [],
          category: data.category,
          difficulty: data.difficulty || 3,
          upload_date: new Date(),
          mastery_level: data.masteryLevel || 0,
          review_count: data.reviewCount || 0,
          last_review_date: data.lastReviewDate,
          similar_questions: data.similarQuestions || [],
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new WrongQuestion(question);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户ID查找错题
  static async findByUserId(user_id) {
    try {
      const { data: questions, error } = await global.supabase
        .from('wrong_questions')
        .select('*')
        .eq('user_id', user_id)
        .order('upload_date', { ascending: false });

      if (error) {
        throw error;
      }

      return questions.map(q => new WrongQuestion(q));
    } catch (error) {
      throw error;
    }
  }

  // 根据ID查找错题
  static async findById(id) {
    try {
      const { data: question, error } = await global.supabase
        .from('wrong_questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return new WrongQuestion(question);
    } catch (error) {
      throw error;
    }
  }

  // 更新错题
  static async update(id, data) {
    try {
      const updateData = {};
      
      if (data.questionContent !== undefined) updateData.question_content = data.questionContent;
      if (data.questionImage !== undefined) updateData.question_image = data.questionImage;
      if (data.standardAnswer !== undefined) updateData.standard_answer = data.standardAnswer;
      if (data.userAnswer !== undefined) updateData.user_answer = data.userAnswer;
      if (data.errorReason !== undefined) updateData.error_reason = data.errorReason;
      if (data.knowledgePoints !== undefined) updateData.knowledge_points = data.knowledgePoints;
      if (data.examPoints !== undefined) updateData.exam_points = data.examPoints;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.masteryLevel !== undefined) updateData.mastery_level = data.masteryLevel;
      if (data.reviewCount !== undefined) updateData.review_count = data.reviewCount;
      if (data.lastReviewDate !== undefined) updateData.last_review_date = data.lastReviewDate;
      if (data.similarQuestions !== undefined) updateData.similar_questions = data.similarQuestions;
      
      updateData.updated_at = new Date();

      const { data: question, error } = await global.supabase
        .from('wrong_questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new WrongQuestion(question);
    } catch (error) {
      throw error;
    }
  }

  // 删除错题
  static async delete(id) {
    try {
      const { error } = await global.supabase
        .from('wrong_questions')
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

  // 根据分类查找错题
  static async findByCategory(user_id, category) {
    try {
      const { data: questions, error } = await global.supabase
        .from('wrong_questions')
        .select('*')
        .eq('user_id', user_id)
        .eq('category', category)
        .order('upload_date', { ascending: false });

      if (error) {
        throw error;
      }

      return questions.map(q => new WrongQuestion(q));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = WrongQuestion;