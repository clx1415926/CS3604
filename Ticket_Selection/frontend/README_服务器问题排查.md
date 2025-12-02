# 服务器访问问题排查指南

## 问题：无法访问 http://localhost:5173/index.html

### 可能的原因和解决方案

#### 1. **开发服务器未启动**
**解决方法：**
```bash
cd Ticket_Selection/frontend
npm run dev
```

确保看到类似以下输出：
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### 2. **端口被占用**
如果5173端口被其他程序占用，Vite会自动尝试下一个可用端口（5174, 5175等）。

**解决方法：**
- 查看终端输出，确认实际使用的端口号
- 或者手动指定其他端口：
  ```bash
  npm run dev -- --port 5174
  ```

#### 3. **访问路径问题**
Vite开发服务器支持以下访问方式：
- ✅ `http://localhost:5173/` （推荐）
- ✅ `http://localhost:5173/index.html` （也应该可以工作）

**建议：** 直接访问 `http://localhost:5173/` 即可

#### 4. **浏览器缓存问题**
**解决方法：**
- 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) 强制刷新
- 或者清除浏览器缓存

#### 5. **防火墙或安全软件阻止**
**解决方法：**
- 检查Windows防火墙设置
- 临时关闭安全软件测试

### 快速检查清单

- [ ] 开发服务器是否正在运行？
- [ ] 终端中显示的端口号是多少？
- [ ] 尝试访问 `http://localhost:5173/` 而不是 `/index.html`
- [ ] 尝试强制刷新浏览器（Ctrl+Shift+R）
- [ ] 检查是否有其他程序占用5173端口

### 如果问题仍然存在

1. **重启开发服务器：**
   ```bash
   # 停止当前服务器（Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

2. **检查依赖是否安装：**
   ```bash
   npm install
   ```

3. **查看终端错误信息：**
   - 查看是否有错误或警告信息
   - 检查端口是否被占用

4. **尝试使用其他端口：**
   ```bash
   npm run dev -- --port 3001
   ```

### 常见错误信息

- **"Port 5173 is in use"** → 端口被占用，Vite会自动使用下一个端口
- **"Cannot GET /index.html"** → 尝试访问 `http://localhost:5173/` 而不是 `/index.html`
- **"ERR_CONNECTION_REFUSED"** → 开发服务器未启动

