# 🔍 支付页面调试指南

## 问题诊断
你点击"立即支付"没有看到控制台输出，说明实际运行的不是源代码文件。

## 方法1: 确认访问正确的开发服务器

### 检查你当前访问的 URL
- ❌ **错误**: `http://localhost:5175/...` (这是 preview 模式，使用打包后的旧代码)
- ❌ **错误**: 直接打开 `dist/index.html` (静态文件，不会热更新)
- ✅ **正确**: `http://localhost:5174/...` (开发服务器，实时编译)

### 操作步骤
1. **停止所有服务器**
2. **进入项目目录**:
   ```cmd
   cd d:\Desktop\大三上\SoftwareEngineer\12306\CS3604\Ticket_Management\frontend
   ```
3. **启动开发服务器**:
   ```cmd
   npm run dev
   ```
4. **访问正确的 URL**: `http://localhost:5174/#payment?order_id=xxx&sid=xxx`

---

## 方法2: 使用 React DevTools 定位组件

### 安装 React Developer Tools
1. 在 Chrome/Edge 浏览器安装扩展: "React Developer Tools"
2. 打开支付页面
3. 按 F12 打开开发者工具
4. 切换到 "Components" 标签
5. 点击页面上的 "立即支付" 按钮
6. 在 Components 树中会高亮显示对应的组件
7. 右侧会显示组件的源文件路径

---

## 方法3: 检查网页实际加载的 JS 文件

### 在浏览器中操作
1. 打开支付页面
2. 按 F12 打开开发者工具
3. 切换到 "Sources" 或 "源代码" 标签
4. 查看左侧文件树:
   - 如果看到 `localhost:5174` → `src` → `pages` → `Payment.tsx`，说明使用的是开发模式 ✅
   - 如果只看到 `assets/index-xxx.js`，说明使用的是打包后的代码 ❌

### 手动添加断点
1. 在 Sources 中找到 `Payment.tsx`
2. 在第一行点击行号添加断点
3. 刷新页面，如果断点触发说明这个文件正在被使用

---

## 方法4: 在 HTML 中直接注入调试代码

### 检查入口文件
看看 `index.html` 是否有内联脚本或其他问题:
```cmd
type d:\Desktop\大三上\SoftwareEngineer\12306\CS3604\Ticket_Management\frontend\index.html
```

---

## 方法5: 全局搜索实际的支付代码

### 查找 dist 目录中的实际代码
```cmd
cd d:\Desktop\大三上\SoftwareEngineer\12306\CS3604\Ticket_Management\frontend\dist\assets
dir *.js
```

### 查看打包后的代码内容
从搜索结果看，实际执行的代码在 `dist/assets/index-0a11c624.js` 中：
- 显示的消息是 "支付成功" 而不是 "支付成功，正在跳转..."
- 跳转逻辑是 `window.location.hash=""` 而不是跳转到订单页面

**这说明 dist 目录中的代码是旧版本！**

---

## 方法6: 清理并重新构建

### 完全清理
```cmd
cd d:\Desktop\大三上\SoftwareEngineer\12306\CS3604\Ticket_Management\frontend
rmdir /s /q dist
rmdir /s /q node_modules\.vite
```

### 重新启动开发服务器
```cmd
npm run dev
```

---

## 方法7: 检查是否有多个服务器在运行

### 查看所有 Node 进程
```cmd
tasklist | findstr node
```

### 如果有多个 node 进程
杀掉所有 node 进程：
```cmd
taskkill /f /im node.exe
```

然后重新启动正确的开发服务器。

---

## 方法8: 使用浏览器的 "覆盖率" 工具

1. F12 → 更多工具 → Coverage (覆盖率)
2. 点击刷新按钮
3. 查看实际加载的 JS 文件
4. 双击文件可以看到实际执行的代码

---

## 快速诊断命令

在浏览器控制台执行以下命令，看看能否找到 React 实例：

```javascript
// 检查当前页面的 React 版本和组件
console.log('React version:', React?.version);
console.log('Current URL:', window.location.href);
console.log('Hash:', window.location.hash);

// 查找页面中所有按钮
document.querySelectorAll('button').forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.textContent, btn.onclick);
});

// 检查是否是 Vite 开发模式
console.log('Vite mode:', import.meta?.env?.MODE);
```

---

## 推荐的调试流程

1. ✅ 先执行 **方法7** 杀掉所有 node 进程
2. ✅ 执行 **方法6** 清理 dist 和缓存
3. ✅ 重新启动开发服务器 `npm run dev`
4. ✅ 确认访问 `http://localhost:5174`
5. ✅ 使用 **方法3** 在 Sources 中确认加载的是源代码
6. ✅ 刷新页面，查看控制台是否出现 🎯 标记

---

## 如果还是不行

告诉我：
1. 你当前访问的完整 URL
2. 控制台 Network 标签中加载的 JS 文件名称
3. Sources 标签中能看到哪些文件
