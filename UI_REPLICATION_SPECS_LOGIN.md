# 12306 登录页 UI 复刻规范（Login Page UI Replication Specs）

**概述**
- 目标页面 `https://kyfw.12306.cn/otn/resources/login.html` 的视觉与交互元素完整采集与结构化描述。
- 文档包含：资源清单、全局样式、组件级样式（含 JSON 代码块）、示例代码与截图说明。
- 所有静态资源已下载并按相对路径组织于 `assets/kyfw_12306_login/` 下，可离线使用。

**资源清单**
- CSS
  - `assets/kyfw_12306_login/css/global.css`
  - `assets/kyfw_12306_login/css/common.css`
  - `assets/kyfw_12306_login/css/public.css`
  - `assets/kyfw_12306_login/css/login.css`
  - `assets/kyfw_12306_login/fonts/iconfont.css`
  - `assets/kyfw_12306_login/toolbar/css/toolbar.css`
  - `assets/kyfw_12306_login/toolbar/css/toolbarmain.css`
- JS
  - `assets/kyfw_12306_login/toolbar/jquery.js`
  - `assets/kyfw_12306_login/toolbar/base64.js`
  - `assets/kyfw_12306_login/toolbar/soundmanager2.js`
  - `assets/kyfw_12306_login/toolbar/pinyin.js`
  - `assets/kyfw_12306_login/toolbar/handleInnerIframe.js`
  - `assets/kyfw_12306_login/toolbar/toolbar.js`
  - `assets/kyfw_12306_login/js/framework/jquery-1.9.1.js`
  - `assets/kyfw_12306_login/js/vendor/nc.js`
  - `assets/kyfw_12306_login/js/framework/jquery.SuperSlide2.js`
  - `assets/kyfw_12306_login/js/framework/jquery.cookie.js`
  - `assets/kyfw_12306_login/js/framework/base64js.min.js`
  - `assets/kyfw_12306_login/js/framework/SM4.js`
  - `assets/kyfw_12306_login/js/login_new_v20221230.js`
  - `assets/kyfw_12306_login/route/kyfw.12306.cn/route.js`
  - `assets/kyfw_12306_login/route/kyfw.12306.cn/otn/route.js`
  - `assets/kyfw_12306_login/route/kyfw.12306.cn/otn/resources/route.js`
  - `assets/kyfw_12306_login/route/kyfw.12306.cn/otn/resources/login.html.js`
- 图片与图标
  - `assets/kyfw_12306_login/images/logo.png`
  - `assets/kyfw_12306_login/images/bg-train.png`
  - `assets/kyfw_12306_login/images/banner-login-20200924.jpg`
  - `assets/kyfw_12306_login/images/banner-login-20200629.jpg`
  - `assets/kyfw_12306_login/images/loading.gif`
  - `assets/kyfw_12306_login/images/code-tips.png`
  - `assets/kyfw_12306_login/images/login-success.png`
  - `assets/kyfw_12306_login/images/download.png`
  - `assets/kyfw_12306_login/images/counter.png`
  - `assets/kyfw_12306_login/images/link02.png`
  - `assets/kyfw_12306_login/images/link03.png`
  - `assets/kyfw_12306_login/images/link04.png`
  - `assets/kyfw_12306_login/images/link05.png`
  - `assets/kyfw_12306_login/images/zgtlwb.png`
  - `assets/kyfw_12306_login/images/zgtlwx.png`
  - `assets/kyfw_12306_login/images/public.png`
  - `assets/kyfw_12306_login/images/gongan.png`
  - `assets/kyfw_12306_login/images/footer-slh.jpg`
  - `assets/kyfw_12306_login/images/slide.png`
  - 工具栏图标位于 `assets/kyfw_12306_login/toolbar/img/*.png`
- 字体（由 `iconfont.css` 引用，已自动下载）
  - 位于 `assets/kyfw_12306_login/fonts/` 目录（如 `.woff`、`.ttf` 等）
- 元素截图
  - `assets/kyfw_12306_login/screenshots/login_button.png`
  - `assets/kyfw_12306_login/screenshots/username_input.png`

**全局样式**
```json
{
  "componentName": "Global",
  "styles": {
    "fontFamily": "Tahoma, 宋体",
    "fontSize": "12px",
    "color": "#333333",
    "backgroundColor": "#FFFFFF",
    "lineHeight": "normal"
  },
  "palette": {
    "primary": "#3B99FC",
    "secondary": "#FF8000",
    "error": "#E12525",
    "warning": "#FF9027",
    "textPrimary": "#333333",
    "textSecondary": "#666666",
    "textMuted": "#999999",
    "borderDefault": "#DADADA",
    "bgLight": "#F8F8F8",
    "bgPanel": "#EAeded",
    "bgDarkBlue": "#184F87"
  }
}
```

**页面结构与元素统计**
- 元素计数（约）：
  - `button`: 3
  - `input`: 10
  - `select`: 0
  - `a`: 50
  - `img`: 37
  - `checkbox`: 0
  - `radio`: 0
  - `textarea`: 0
  - `label`: 6
  - `table`: 0
  - `list (ul/ol)`: 8
  - `nav`: 0

**顶部区（Logo / 站点入口）**
```json
{
  "componentName": "TopHeader",
  "structure": "Block",
  "styles": {
    "height": "64px",
    "backgroundColor": "#FFFFFF",
    "borderBottom": "1px solid #EFEFEF",
    "padding": "0 24px"
  },
  "children": [
    {
      "element": "LogoLink",
      "styles": {
        "display": "block",
        "width": "200px",
        "height": "50px",
        "backgroundImage": "url(../images/logo.png)",
        "backgroundRepeat": "no-repeat",
        "backgroundSize": "contain"
      }
    }
  ]
}
```

**Banner 区（背景与营销图）**
```json
{
  "componentName": "Banner",
  "structure": "Absolute + Background",
  "styles": {
    "height": "600px",
    "backgroundImage": "url(../images/bg-train.png)",
    "backgroundPosition": "center",
    "backgroundRepeat": "no-repeat",
    "backgroundColor": "#FFFFFF"
  },
  "children": [
    {
      "element": "PromoImage1",
      "styles": {
        "width": "100%",
        "height": "600px",
        "backgroundImage": "url(../images/banner-login-20200924.jpg)",
        "backgroundSize": "cover"
      }
    },
    {
      "element": "PromoImage2",
      "styles": {
        "width": "100%",
        "height": "600px",
        "backgroundImage": "url(../images/banner-login-20200629.jpg)",
        "backgroundSize": "cover"
      }
    }
  ]
}
```

**登录面板（账号登录）**
```json
{
  "componentName": "LoginPanel",
  "structure": "Card + Tabs",
  "styles": {
    "width": "360px",
    "minHeight": "260px",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #DEDEDE",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.06)",
    "borderRadius": "4px",
    "padding": "16px"
  },
  "children": [
    {
      "element": "Tabs",
      "styles": {
        "display": "flex",
        "gap": "16px",
        "borderBottom": "1px solid #EFEFEF",
        "padding": "0 0 8px 0"
      },
      "items": [
        { "text": "账号登录", "styles": { "color": "#3B99FC", "fontWeight": "600" } },
        { "text": "扫码登录", "styles": { "color": "#666666" } }
      ]
    },
    {
      "element": "UserNameInput",
      "styles": {
        "height": "44px",
        "lineHeight": "44px",
        "padding": "4px 10px 4px 36px",
        "border": "1px solid #DADADA",
        "borderRadius": "2px",
        "fontFamily": "Tahoma",
        "color": "#333333",
        "margin": "12px 0 8px"
      },
      "attrs": { "id": "J-userName", "type": "text", "placeholder": "用户名/邮箱/手机号" }
    },
    {
      "element": "PasswordInput",
      "styles": {
        "height": "44px",
        "lineHeight": "44px",
        "padding": "4px 10px 4px 36px",
        "border": "1px solid #DADADA",
        "borderRadius": "2px",
        "fontFamily": "Tahoma",
        "color": "#333333",
        "margin": "8px 0 12px"
      },
      "attrs": { "id": "J-password", "type": "password", "placeholder": "密码" }
    },
    {
      "element": "SubmitButton",
      "styles": {
        "height": "44px",
        "padding": "4px 10px",
        "backgroundColor": "#3B99FC",
        "color": "#FFFFFF",
        "border": "none",
        "borderRadius": "2px",
        "fontFamily": "Tahoma, 宋体",
        "fontWeight": "600",
        "cursor": "pointer",
        "display": "block",
        "width": "100%"
      },
      "attrs": { "id": "J-login", "role": "button" },
      "hoverStyles": { "backgroundColor": "#2A88EB" }
    },
    {
      "element": "Links",
      "styles": { "display": "flex", "gap": "10px", "marginTop": "8px" },
      "items": [
        { "text": "注册12306账号", "styles": { "color": "#3B99FC", "margin": "0 5px" } },
        { "text": "忘记密码？", "styles": { "color": "#999999" } }
      ]
    }
  ]
}
```

**扫码登录面板（二维码登录）**
```json
{
  "componentName": "QrLoginPanel",
  "structure": "Card",
  "styles": {
    "width": "360px",
    "minHeight": "260px",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #DEDEDE",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.06)",
    "borderRadius": "4px",
    "padding": "16px"
  },
  "children": [
    {
      "element": "QrImage",
      "styles": { "width": "200px", "height": "200px", "backgroundImage": "url(../images/public.png)", "backgroundSize": "contain", "margin": "0 auto" },
      "attrs": { "alt": "使用12306APP扫描本二维码进行登录" }
    },
    {
      "element": "Tips",
      "styles": { "display": "flex", "justifyContent": "center", "gap": "12px", "color": "#666666" },
      "items": [
        { "text": "扫一扫登录" },
        { "text": "更快" },
        { "text": "更安全" }
      ]
    }
  ]
}
```

**辅助工具栏（无障碍/读屏工具）**
```json
{
  "componentName": "AssistToolbar",
  "structure": "Fixed Panel",
  "styles": {
    "position": "fixed",
    "right": "24px",
    "bottom": "24px",
    "width": "320px",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #DEDEDE",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.08)",
    "borderRadius": "6px"
  },
  "children": [
    { "element": "IconSound", "styles": { "backgroundImage": "url(../toolbar/img/sound_normal.png)", "width": "24px", "height": "24px" } },
    { "element": "IconVolume", "styles": { "backgroundImage": "url(../toolbar/img/vol_normal.png)", "width": "24px", "height": "24px" } },
    { "element": "IconHelp", "styles": { "backgroundImage": "url(../toolbar/img/help1.png)", "width": "24px", "height": "24px" } }
  ]
}
```

**底部区（合作链接与备案信息）**
```json
{
  "componentName": "Footer",
  "structure": "Grid",
  "styles": {
    "backgroundColor": "#F8F8F8",
    "borderTop": "1px solid #EFEFEF",
    "padding": "24px 0"
  },
  "children": [
    { "element": "PartnerLink01", "styles": { "backgroundImage": "url(../images/link05.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink02", "styles": { "backgroundImage": "url(../images/link02.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink03", "styles": { "backgroundImage": "url(../images/link03.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink04", "styles": { "backgroundImage": "url(../images/link04.png)", "width": "120px", "height": "32px" } },
    { "element": "WeChat", "styles": { "backgroundImage": "url(../images/zgtlwb.png)", "width": "32px", "height": "32px" } },
    { "element": "Weibo", "styles": { "backgroundImage": "url(../images/zgtlwx.png)", "width": "32px", "height": "32px" } },
    { "element": "PoliceBadge", "styles": { "backgroundImage": "url(../images/gongan.png)", "width": "120px", "height": "32px" } }
  ]
}
```

**示例代码块**
- 登录按钮（示例）
```html
<a id="J-login" class="btn btn-primary form-block" href="javascript:;">立即登录</a>
```
- 用户名输入框（示例）
```html
<input id="J-userName" class="input" type="text" placeholder="用户名/邮箱/手机号" style="height:44px;line-height:44px;padding:4px 10px 4px 36px;" />
```

**元素截图**
- 登录按钮：`assets/kyfw_12306_login/screenshots/login_button.png`
- 用户名输入：`assets/kyfw_12306_login/screenshots/username_input.png`

**质量与一致性校验**
- 视觉一致性：颜色与字体栈按“全局样式”与“组件 JSON”强约束使用。
- 资源有效性：所有 CSS/JS/图片/字体已下载并可通过相对路径加载。
- 结构完整性：主要交互元素已采集并在“组件样式详解”中以 JSON 描述。
- 访问提示：铁路未授权其他网站或 APP 开展类似服务内容，建议使用官方 APP。

