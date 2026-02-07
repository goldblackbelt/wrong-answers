class ReviewPlan {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.questions = data.questions;
    this.next_review_date = data.next_review_date;
    this.review_interval = data.review_interval;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建复习计划
  static async create(data) {
    try {
      const { data: plan, error } = await global.supabase
        .from('review_plans')
        .insert({
          user_id: data.userId,
          questions: data.questions || [],
          next_review_date: data.nextReviewDate,
          review_interval: data.reviewInterval || 1,
          status: data.status || 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new ReviewPlan(plan);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户ID查找复习计划
  static async findByUserId(user_id) {
    try {
      const { data: plans, error } = await global.supabase
        .from('review_plans')
        .select('*')
        .eq('user_id', user_id)
        .order('next_review_date', { ascending: true });

      if (error) {
        throw error;
      }

      return plans.map(p => new ReviewPlan(p));
    } catch (error) {
      throw error;
    }
  }

  // 查找待复习的计划
  static async findPending(user_id) {
    try {
      const now = new Date();
      const { data: plans, error } = await global.supabase
        .from('review_plans')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'pending')
        .lte('next_review_date', now)
        .order('next_review_date', { ascending: true });

      if (error) {
        throw error;
      }

      return plans.map(p => new ReviewPlan(p));
    } catch (error) {
      throw error;
    }
  }

  // 更新复习计划
  static async update(id, data) {
    try {
      const updateData = {};
      
      if (data.questions !== undefined) updateData.questions = data.questions;
      if (data.nextReviewDate !== undefined) updateData.next_review_date = data.nextReviewDate;
      if (data.reviewInterval !== undefined) updateData.review_interval = data.reviewInterval;
      if (data.status !== undefined) updateData.status = data.status;
      
      updateData.updated_at = new Date();

      const { data: plan, error } = await global.supabase
        .from('review_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new ReviewPlan(plan);
    } catch (error) {
      throw error;
    }
  }

  // 删除复习计划
  static async delete(id) {
    try {
      const { error } = await global.supabase
        .from('review_plans')
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

module.exports = ReviewPlan;