class MasteryRecord {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.question_id = data.question_id;
    this.mastery_level = data.mastery_level;
    this.attempt_count = data.attempt_count;
    this.correct_count = data.correct_count;
    this.last_attempt_date = data.last_attempt_date;
    this.history = data.history;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建掌握度记录
  static async create(data) {
    try {
      const { data: record, error } = await global.supabase
        .from('mastery_records')
        .insert({
          user_id: data.userId,
          question_id: data.questionId,
          mastery_level: data.masteryLevel || 0,
          attempt_count: data.attemptCount || 0,
          correct_count: data.correctCount || 0,
          last_attempt_date: data.lastAttemptDate,
          history: data.history || [],
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new MasteryRecord(record);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户ID和问题ID查找掌握度记录
  static async findByUserAndQuestion(user_id, question_id) {
    try {
      const { data: record, error } = await global.supabase
        .from('mastery_records')
        .select('*')
        .eq('user_id', user_id)
        .eq('question_id', question_id)
        .single();

      if (error) {
        return null;
      }

      return new MasteryRecord(record);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户ID查找所有掌握度记录
  static async findByUserId(user_id) {
    try {
      const { data: records, error } = await global.supabase
        .from('mastery_records')
        .select('*')
        .eq('user_id', user_id);

      if (error) {
        throw error;
      }

      return records.map(r => new MasteryRecord(r));
    } catch (error) {
      throw error;
    }
  }

  // 更新掌握度记录
  static async update(id, data) {
    try {
      const updateData = {};
      
      if (data.masteryLevel !== undefined) updateData.mastery_level = data.masteryLevel;
      if (data.attemptCount !== undefined) updateData.attempt_count = data.attemptCount;
      if (data.correctCount !== undefined) updateData.correct_count = data.correctCount;
      if (data.lastAttemptDate !== undefined) updateData.last_attempt_date = data.lastAttemptDate;
      if (data.history !== undefined) updateData.history = data.history;
      
      updateData.updated_at = new Date();

      const { data: record, error } = await global.supabase
        .from('mastery_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new MasteryRecord(record);
    } catch (error) {
      throw error;
    }
  }

  // 更新或创建掌握度记录
  static async upsert(user_id, question_id, data) {
    try {
      // 先查找是否存在
      const existingRecord = await this.findByUserAndQuestion(user_id, question_id);
      
      if (existingRecord) {
        // 更新现有记录
        return await this.update(existingRecord.id, data);
      } else {
        // 创建新记录
        return await this.create({
          userId: user_id,
          questionId: question_id,
          ...data
        });
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasteryRecord;