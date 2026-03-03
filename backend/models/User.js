const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 密码加密方法
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw error;
    }
  }

  // 密码验证方法 - 超级简单可靠
  static async comparePassword(candidatePassword, hashedPassword) {
    console.log('密码验证 - 输入:', candidatePassword, '存储:', hashedPassword);
    try {
      if (!hashedPassword) {
        return false;
      }
      
      if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
        const result = await bcrypt.compare(candidatePassword, hashedPassword);
        console.log('bcrypt 验证结果:', result);
        return result;
      }
      
      const result = candidatePassword === hashedPassword;
      console.log('明文比较结果:', result);
      return result;
    } catch (error) {
      console.error('密码比较错误:', error);
      return false;
    }
  }

  // 创建用户
  static async create(data) {
    try {
      console.log('创建用户:', data.email);
      
      // 加密密码
      const hashedPassword = await this.hashPassword(data.password);
      console.log('密码已加密');
      
      const { data: user, error } = await global.supabase
        .from('users')
        .insert({
          username: data.username,
          email: data.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('创建用户错误:', error);
        throw new Error(`创建用户失败: ${error.message || '未知错误'}`);
      }

      console.log('用户创建成功:', user);
      return new User(user);
    } catch (error) {
      console.error('用户创建过程错误:', error);
      throw error;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    try {
      const { data: user, error } = await global.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return null;
      }

      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      const { data: user, error } = await global.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // 更新用户
  static async update(id, data) {
    try {
      const updateData = { ...data };
      updateData.updated_at = new Date();

      // 如果更新密码，需要重新加密
      if (updateData.password) {
        updateData.password = await this.hashPassword(updateData.password);
      }

      const { data: user, error } = await global.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new User(user);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;