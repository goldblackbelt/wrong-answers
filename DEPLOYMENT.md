# Vercel 部署指南

本指南将帮助您将错题本系统部署到 Vercel 平台，使其可以通过外部 URL 访问。

## 准备工作

1. **Vercel 账号**：如果您还没有 Vercel 账号，请先在 [Vercel 官网](https://vercel.com/) 注册一个账号。

2. **GitHub 或 GitLab 仓库**：将您的项目代码上传到 GitHub 或 GitLab 仓库，因为 Vercel 需要从代码仓库部署项目。

3. **项目配置**：确保您的项目包含以下文件：
   - `vercel.json`：Vercel 部署配置文件
   - `package.json`：项目依赖和脚本配置
   - `backend/server.js`：后端服务器入口文件
   - `frontend/`：前端代码目录

## 部署步骤

### 步骤 1：上传代码到代码仓库

1. 在 GitHub 或 GitLab 上创建一个新的仓库。
2. 将本地项目代码上传到这个仓库。

### 步骤 2：在 Vercel 上导入项目

1. 登录 Vercel 账号。
2. 点击 "New Project" 按钮。
3. 选择 "Import Git Repository" 选项。
4. 连接您的 GitHub 或 GitLab 账号。
5. 选择您刚刚创建的代码仓库。
6. 点击 "Import" 按钮。

### 步骤 3：配置项目设置

1. **Project Name**：输入项目名称（可选）。
2. **Root Directory**：保持默认值，使用项目根目录。
3. **Build Command**：输入 `npm run build:frontend`（用于构建前端应用）。
4. **Output Directory**：保持默认值，Vercel 会根据 `vercel.json` 配置自动处理。
5. **Environment Variables**：添加以下环境变量（如果需要）：
   - `PORT`：3000（后端服务器端口）
   - `SUPABASE_URL`：您的 Supabase 项目 URL（如果使用 Supabase）
   - `SUPABASE_ANON_KEY`：您的 Supabase 匿名密钥（如果使用 Supabase）
   - `SUPABASE_SERVICE_ROLE_KEY`：您的 Supabase 服务角色密钥（如果使用 Supabase）

### 步骤 4：部署项目

1. 点击 "Deploy" 按钮开始部署过程。
2. Vercel 会自动构建和部署您的项目。
3. 部署完成后，Vercel 会显示部署成功的页面，并提供一个外部 URL。

### 步骤 5：验证部署结果

1. 打开 Vercel 提供的外部 URL，检查前端页面是否正常显示。
2. 测试登录、注册等功能，确保后端 API 接口正常工作。
3. 检查移动端适配是否正常。

## 项目配置说明

### vercel.json 配置

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

### 前端配置

- **Vite 配置**：已配置为构建到 `frontend/dist` 目录。
- **Axios 配置**：已配置为使用相对路径 `/api` 作为基础 URL，确保在 Vercel 上正确访问后端 API。

### 后端配置

- **服务器端口**：使用环境变量 `PORT` 或默认值 3000。
- **静态文件服务**：已配置为提供前端构建后的静态文件。
- **CORS 配置**：已配置为允许跨域请求。

## 故障排除

### 1. 后端 API 接口无法访问

- 检查 Vercel 项目的 "Functions" 标签页，确认后端函数是否正常部署。
- 检查环境变量是否正确设置。
- 检查后端代码是否有语法错误或其他问题。

### 2. 前端页面显示错误

- 检查 Vercel 项目的 "Deployments" 标签页，查看构建过程是否有错误。
- 检查前端代码是否有语法错误或其他问题。
- 检查前端 API 请求是否正确发送到后端。

### 3. 移动端适配问题

- 检查前端响应式设计是否正确实现。
- 使用浏览器的开发者工具模拟移动设备，测试页面显示效果。

## 注意事项

1. **环境变量安全**：不要在代码中硬编码敏感信息，如 API 密钥、数据库连接字符串等，应使用环境变量。

2. **构建优化**：确保前端构建过程正确配置，生成优化后的静态文件。

3. **性能优化**：考虑使用 CDN、缓存等技术优化网站性能。

4. **监控和日志**：使用 Vercel 的监控和日志功能，及时发现和解决问题。

5. **域名配置**：如果需要使用自定义域名，可以在 Vercel 项目设置中配置。

## 部署成功后

部署成功后，您可以通过 Vercel 提供的外部 URL 访问您的错题本系统，例如：`https://your-project-name.vercel.app`。

您可以与他人分享这个 URL，让他们也能访问和使用您的错题本系统。
