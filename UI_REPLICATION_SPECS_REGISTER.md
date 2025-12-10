# 12306 注册页 UI 复刻规范（Register Page）

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_register/css/reg.css
  - assets/kyfw_12306_register/css/validation.css
  - assets/kyfw_12306_register/css/calendarNew.css
  - assets/kyfw_12306_register/css/suggest.css
  - assets/kyfw_12306_register/css/common_css.css_cssVersion_1.9093
- JS
  - assets/kyfw_12306_register/js/jquery.js
  - assets/kyfw_12306_register/js/init.js
  - assets/kyfw_12306_register/js/registGeneral_js.js_scriptVersion_1.95000
  - assets/kyfw_12306_register/js/registDetailed_js.js_scriptVersion_1.95000
  - assets/kyfw_12306_register/js/data.jcalendar.js
  - assets/kyfw_12306_register/js/j.suggest.js
- 图片
  - assets/kyfw_12306_register/images/logo.png
  - assets/kyfw_12306_register/images/footer-slh.jpg
  - assets/kyfw_12306_register/images/public.png
  - assets/kyfw_12306_register/images/zgtlwb.png
  - assets/kyfw_12306_register/images/zgtlwx.png
  - assets/kyfw_12306_register/images/passport01.jpg
  - assets/kyfw_12306_register/images/passport02.jpg
  - assets/kyfw_12306_register/images/passport03.png

## 全局样式 JSON
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

## Header 组件
```json
{
  "componentName": "Header",
  "structure": {
    "type": "header",
    "children": [
      {
        "type": "a",
        "class": "logo-link",
        "children": [
          {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/logo.png", "alt": "12306"}}
        ]
      },
      {"type": "nav", "children": []}
    ]
  },
  "styles": {
    "height": "60px",
    "display": "flex",
    "alignItems": "center",
    "padding": "0 16px",
    "backgroundColor": "#184F87"
  },
  "logoLinkStyles": {
    "display": "flex",
    "alignItems": "center",
    "backgroundColor": "#FFFFFF",
    "padding": "6px 12px",
    "borderRadius": "3px"
  },
  "logoImgStyles": {
    "height": "40px",
    "width": "auto",
    "display": "block"
  }
}
```

示例代码
```html
<header class="site-header">
  <div class="container">
    <a href="http://localhost:8080/" class="logo-link">
      <img src="assets/kyfw_12306_register/images/logo.png" alt="中国铁路12306" class="logo-img" />
    </a>
    <nav class="nav">
      <a href="http://localhost:8080/">首页</a>
    </nav>
  </div>
</header>
```

## 注册步骤 Step 组件
```json
{
  "componentName": "Step",
  "structure": {
    "type": "ul",
    "children": [
      {"type": "li", "text": "填写账户信息"},
      {"type": "li", "text": "身份信息验证"},
      {"type": "li", "text": "手机核验"}
    ]
  },
  "styles": {
    "height": "30px",
    "marginBottom": "10px"
  },
  "itemStyles": {
    "width": "225px",
    "height": "30px",
    "lineHeight": "30px",
    "padding": "0 20px 0 0",
    "backgroundColor": "#E3EDF4",
    "color": "#999999",
    "textAlign": "center",
    "fontWeight": "400",
    "fontSize": "14px",
    "overflow": "hidden",
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "center",
    "boxSizing": "border-box"
  },
  "activeItemStyles": {
    "backgroundColor": "#60C6E7",
    "color": "#FFFFFF",
    "fontWeight": "700"
  }
}
```

示例代码
```html
<div class="steps">
  <div class="step active" data-step="account">填写账户信息</div>
  <div class="step" data-step="phone">身份信息验证</div>
  <div class="step" data-step="identity">手机核验</div>
  <div class="step" data-step="terms">服务条款确认</div>
  <div class="step" data-step="complete">注册完成</div>
</div>
```

**步骤条文字居中规范：**
- 每个步骤块中的文字必须完全居中显示
- 使用 `display: flex`、`align-items: center` 和 `justify-content: center` 确保文字在水平和垂直方向都居中
- 设置 `box-sizing: border-box` 确保 padding 不影响布局计算
- 右侧保留 `padding-right: 20px` 为箭头留出空间，但文字在可用空间内居中

## FormPanel 组件
```json
{
  "componentName": "FormPanel",
  "structure": {
    "type": "form",
    "attrs": {"id": "registForm"},
    "children": [
      {"type": "InputGroup", "attrs": {"label": "用户名", "for": "userName"}},
      {"type": "InputGroup", "attrs": {"label": "登录密码", "for": "passWord"}},
      {"type": "InputGroup", "attrs": {"label": "确认密码", "for": "confirmPassWord"}},
      {"type": "InputGroup", "attrs": {"label": "姓名", "for": "regist_name"}},
      {"type": "SelectGroup", "attrs": {"label": "国家/地区", "for": "nation"}},
      {"type": "SelectGroup", "attrs": {"label": "证件类型", "for": "cardType"}},
      {"type": "InputGroup", "attrs": {"label": "证件号码", "for": "cardCode"}},
      {"type": "InputGroup", "attrs": {"label": "出生日期", "for": "born_date"}},
      {"type": "InputGroup", "attrs": {"label": "证件有效期", "for": "id_limit_date_end"}},
      {"type": "InputGroup", "attrs": {"label": "手机区号", "for": "mobileCode"}},
      {"type": "InputGroup", "attrs": {"label": "手机号", "for": "mobileNo"}},
      {"type": "InputGroup", "attrs": {"label": "邮箱", "for": "email"}},
      {"type": "CheckboxGroup", "attrs": {"label": "同意服务条款", "for": "checkAgree"}}
    ]
  },
  "styles": {
    "paddingTop": "40px",
    "backgroundColor": "#FFFFFF"
  },
  "layout": {
    "labelWidth": "375px",
    "labelPaddingRight": "5px",
    "rowHeight": "30px",
    "rowGap": "5px"
  },
  "checkboxStyles": {
    "display": "flex",
    "alignItems": "flex-start",
    "gap": "6px",
    "fontSize": "12px",
    "lineHeight": "1.6",
    "cursor": "pointer",
    "flexWrap": "nowrap"
  },
  "checkboxTextStyles": {
    "display": "inline-block",
    "whiteSpace": "nowrap",
    "lineHeight": "1.6"
  },
  "checkboxLinkStyles": {
    "color": "#3B99FC",
    "textDecoration": "none",
    "whiteSpace": "nowrap",
    "display": "inline"
  },
  "importantNote": "协议复选框文本必须保持在同一行显示，不允许换行。使用 white-space: nowrap 确保整个协议文本不换行。"
}
```

示例代码
```html
<form id="registForm" class="reg-list">
  <li>
    <span class="label">用户名</span>
    <div class="r-txt"><input id="userName" name="loginUserDTO.user_name" type="text" placeholder="用户名／邮箱／手机号" /></div>
  </li>
  <li>
    <span class="label">登录密码</span>
    <div class="r-txt"><input id="passWord" name="userDTO.password" type="password" /></div>
  </li>
  <li>
    <span class="label">确认密码</span>
    <div class="r-txt"><input id="confirmPassWord" name="confirmPassWord" type="password" /></div>
  </li>
  <li>
    <span class="label">姓名</span>
    <div class="r-txt"><input id="regist_name" name="loginUserDTO.name" type="text" /></div>
  </li>
  <li>
    <span class="label">国家/地区</span>
    <div class="r-txt"><select id="nation"><option value="CN">中国</option><option value="CHN">中国</option></select></div>
  </li>
  <li>
    <span class="label">证件类型</span>
    <div class="r-txt"><select id="cardType" name="loginUserDTO.id_type_code"><option value="1">中国居民身份证</option><option value="P">护照</option><option value="H">港澳通行证</option><option value="G">台湾通行证</option></select></div>
  </li>
  <li>
    <span class="label">证件号码</span>
    <div class="r-txt"><input id="cardCode" name="loginUserDTO.id_no" type="text" /></div>
  </li>
  <li>
    <span class="label">出生日期</span>
    <div class="r-txt"><input id="born_date" type="text" /></div>
  </li>
  <li>
    <span class="label">证件有效期</span>
    <div class="r-txt"><input id="id_limit_date_end" type="text" /></div>
  </li>
  <li>
    <span class="label">手机区号</span>
    <div class="r-txt"><select id="mobileCode"><option value="86">+86 中国</option></select></div>
  </li>
  <li>
    <span class="label">手机号</span>
    <div class="r-txt"><input id="mobileNo" name="userDTO.mobile_no" type="text" /></div>
  </li>
  <li>
    <span class="label">邮箱</span>
    <div class="r-txt"><input id="email" name="userDTO.email" type="text" /></div>
  </li>
  <li>
    <span class="label">服务条款</span>
    <div class="r-txt">
      <label class="checkbox" for="terms">
        <input type="checkbox" id="terms" />
        <span class="checkbox-text">我已阅读并同意遵守<a id="link-terms" href="terms.html" target="_blank" rel="noopener noreferrer">《中国铁路客户服务中心网站服务条款》</a>和<a id="link-privacy" href="privacy.html" target="_blank" rel="noopener noreferrer">《隐私政策》</a></span>
      </label>
    </div>
  </li>
</form>
```

**重要样式说明：**
- 协议复选框文本必须保持在同一行显示，不允许换行
- 使用 `white-space: nowrap` 确保整个协议文本不换行
- 复选框容器使用 `display: flex` 和 `flex-wrap: nowrap` 防止换行
- 链接文本使用 `display: inline` 和 `white-space: nowrap` 保持内联显示

## ButtonGroup 组件
```json
{
  "componentName": "ButtonGroup",
  "structure": {
    "type": "div",
    "children": [
      {"type": "button", "attrs": {"id": "nextBtn", "type": "submit"}, "text": "完成注册"}
    ]
  },
  "styles": {
    "margin": "50px 0",
    "display": "flex",
    "gap": "12px"
  },
  "buttonStyles": {
    "height": "30px",
    "padding": "0 16px",
    "backgroundColor": "#FF8000",
    "color": "#FFFFFF",
    "borderRadius": "4px"
  },
  "hoverStyles": {
    "backgroundColor": "#FF9027"
  }
}
```

示例代码
```html
<div class="lay-btn">
  <button id="nextBtn" type="submit" class="btn-primary">完成注册</button>
</div>
```

## Footer 组件
```json
{
  "componentName": "Footer",
  "structure": {
    "type": "footer",
    "class": "site-footer",
    "children": [
      {
        "type": "div",
        "class": "footer-con",
        "children": [
          {
            "type": "div",
            "class": "foot-links",
            "children": [
              {"type": "h2", "text": "友情链接", "class": "foot-con-tit"},
              {"type": "ul", "class": "foot-links-list", "children": [
                {"type": "li", "children": [{"type": "a", "text": "12306官网", "href": "https://www.12306.cn/index/"}]},
                {"type": "li", "children": [{"type": "a", "text": "中国国家铁路集团", "href": "https://www.china-railway.com.cn/"}]},
                {"type": "li", "children": [{"type": "a", "text": "交通运输部", "href": "http://www.mot.gov.cn/"}]},
                {"type": "li", "children": [{"type": "a", "text": "中国政府网", "href": "http://www.gov.cn/"}]},
                {"type": "li", "children": [{"type": "a", "text": "信用中国", "href": "http://www.creditchina.gov.cn/"}]}
              ]}
            ]
          },
          {
            "type": "ul",
            "class": "foot-code",
            "children": [
              {
                "type": "li",
                "children": [
                  {"type": "h2", "text": "中国铁路官方微信", "class": "foot-con-tit"},
                  {"type": "div", "class": "code-pic", "children": [
                    {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/zgtlwb.png", "alt": "中国铁路官方微信"}}
                  ]}
                ]
              },
              {
                "type": "li",
                "children": [
                  {"type": "h2", "text": "中国铁路官方微博", "class": "foot-con-tit"},
                  {"type": "div", "class": "code-pic", "children": [
                    {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/zgtlwx.png", "alt": "中国铁路官方微博"}}
                  ]}
                ]
              },
              {
                "type": "li",
                "children": [
                  {"type": "h2", "text": "12306 公众号", "class": "foot-con-tit"},
                  {"type": "div", "class": "code-pic", "children": [
                    {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/public.png", "alt": "12306 公众号"}}
                  ]}
                ]
              },
              {
                "type": "li",
                "children": [
                  {"type": "h2", "text": "铁路12306", "class": "foot-con-tit"},
                  {"type": "div", "class": "code-pic", "children": [
                    {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/download.png", "alt": "铁路12306"}},
                    {"type": "div", "class": "code-tips", "text": "官方APP下载，目前铁路未授权其他网站或APP开展类似服务内容，敬请广大用户注意。"}
                  ]}
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "div",
        "class": "footer-txt",
        "children": [
          {
            "type": "p",
            "children": [
              {"type": "span", "class": "mr", "text": "版权所有©2008-2025"},
              {"type": "span", "class": "mr", "text": "中国铁道科学研究院集团有限公司"},
              {"type": "span", "text": "技术支持：铁旅科技有限公司"}
            ]
          },
          {
            "type": "p",
            "children": [
              {"type": "span", "class": "mr", "children": [
                {"type": "img", "attrs": {"src": "assets/kyfw_12306_register/images/gongan.png", "alt": "公安", "width": "13px", "height": "13px"}},
                {"type": "a", "text": "京公网安备 11010802038392号", "href": "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802038392"}
              ]},
              {"type": "span", "class": "mr", "text": "|"},
              {"type": "span", "class": "mr", "text": "京ICP备05020493号-4"},
              {"type": "span", "class": "mr", "text": "|"},
              {"type": "span", "text": "ICP证：京B2-20202537"}
            ]
          },
        ]
      }
    ]
  },
  "styles": {
    "backgroundColor": "#F8F8F8",
    "borderTop": "1px solid #EFEFEF",
    "padding": "24px 0"
  },
  "footerConStyles": {
    "display": "flex",
    "justifyContent": "space-between",
    "alignItems": "flex-start",
    "paddingBottom": "20px",
    "borderBottom": "1px solid #EFEFEF",
    "gap": "40px"
  },
  "footLinksStyles": {
    "flex": "1",
    "display": "flex",
    "flexDirection": "column",
    "alignItems": "flex-start"
  },
  "footLinksTitleStyles": {
    "textAlign": "left",
    "marginBottom": "15px",
    "width": "100%"
  },
  "footLinksListStyles": {
    "display": "flex",
    "flexWrap": "wrap",
    "gap": "15px",
    "listStyle": "none",
    "alignItems": "center"
  },
  "footLinksListItemStyles": {
    "margin": "0",
    "display": "flex",
    "alignItems": "center"
  },
  "footLinksLinkStyles": {
    "color": "#666666",
    "textDecoration": "none",
    "fontSize": "12px",
    "whiteSpace": "nowrap",
    "lineHeight": "1.5"
  },
  "footCodeStyles": {
    "display": "flex",
    "gap": "30px",
    "listStyle": "none",
    "justifyContent": "flex-start",
    "alignItems": "flex-start"
  },
  "footCodeItemStyles": {
    "display": "flex",
    "flexDirection": "column",
    "alignItems": "center",
    "flex": "0 0 auto",
    "width": "120px",
    "textAlign": "center"
  },
  "codeTitleStyles": {
    "fontSize": "14px",
    "color": "#333333",
    "marginBottom": "15px",
    "fontWeight": "600",
    "textAlign": "center",
    "width": "100%",
    "lineHeight": "1.4",
    "whiteSpace": "nowrap"
  },
  "codePickStyles": {
    "textAlign": "center",
    "marginTop": "0",
    "display": "flex",
    "flexDirection": "column",
    "alignItems": "center",
    "width": "100%"
  },
  "codePickImgStyles": {
    "width": "100px",
    "height": "100px",
    "display": "block",
    "margin": "0 auto",
    "objectFit": "contain"
  },
  "codeTipsStyles": {
    "fontSize": "12px",
    "color": "#999999",
    "marginTop": "8px",
    "lineHeight": "1.5",
    "maxWidth": "120px",
    "textAlign": "center",
    "marginLeft": "auto",
    "marginRight": "auto"
  },
  "importantNotes": {
    "qrCodeAlignment": "二维码区域必须严格对齐：每个二维码项目宽度统一为120px，标题文字居中对齐且不换行，二维码图片尺寸统一为100px×100px，使用flex布局确保垂直和水平居中",
    "friendlyLinksAlignment": "友情链接区域：标题左对齐，链接列表使用flex布局水平排列，链接文字不换行，间距统一为15px",
    "responsiveDesign": "响应式设计：移动端二维码宽度调整为100px，图片缩小为80px×80px，提示文字缩小为11px，使用justify-content: center确保居中"
  }
}
```

示例代码
```html
<footer class="site-footer">
  <div class="container">
    <div class="footer-con">
      <div class="foot-links">
        <h2 class="foot-con-tit">友情链接</h2>
        <ul class="foot-links-list">
          <li><a href="https://www.12306.cn/index/" target="_blank">12306官网</a></li>
          <li><a href="https://www.china-railway.com.cn/" target="_blank">中国国家铁路集团</a></li>
          <li><a href="http://www.mot.gov.cn/" target="_blank">交通运输部</a></li>
          <li><a href="http://www.gov.cn/" target="_blank">中国政府网</a></li>
          <li><a href="http://www.creditchina.gov.cn/" target="_blank">信用中国</a></li>
        </ul>
      </div>
      <ul class="foot-code">
        <li>
          <h2 class="foot-con-tit">中国铁路官方微信</h2>
          <div class="code-pic">
            <img src="assets/kyfw_12306_register/images/zgtlwb.png" alt="中国铁路官方微信">
          </div>
        </li>
        <li>
          <h2 class="foot-con-tit">中国铁路官方微博</h2>
          <div class="code-pic">
            <img src="assets/kyfw_12306_register/images/zgtlwx.png" alt="中国铁路官方微博">
          </div>
        </li>
        <li>
          <h2 class="foot-con-tit">12306 公众号</h2>
          <div class="code-pic">
            <img src="assets/kyfw_12306_register/images/public.png" alt="12306 公众号">
          </div>
        </li>
        <li>
          <h2 class="foot-con-tit">铁路12306</h2>
          <div class="code-pic">
            <img src="assets/kyfw_12306_register/images/download.png" alt="铁路12306">
            <div class="code-tips">官方APP下载，目前铁路未授权其他网站或APP开展类似服务内容，敬请广大用户注意。</div>
          </div>
        </li>
      </ul>
    </div>
    <div class="footer-txt">
      <p>
        <span class="mr">版权所有©2008-2025</span>
        <span class="mr">中国铁道科学研究院集团有限公司</span>
        <span>技术支持：铁旅科技有限公司</span>
      </p>
      <p>
        <span class="mr">
          <img src="assets/kyfw_12306_register/images/gongan.png" alt="公安" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">
          <a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802038392" style="color:#666666;">京公网安备 11010802038392号</a>
        </span>
        <span class="mr">|</span>
        <span class="mr">京ICP备05020493号-4</span>
        <span class="mr">|</span>
        <span>ICP证：京B2-20202537</span>
      </p>
    </div>
  </div>
</footer>
```

**Footer 组件样式详细说明：**

### 友情链接区域对齐规范
- **容器布局**：使用 `display: flex` 和 `flex-direction: column`，标题左对齐
- **标题样式**：`text-align: left`，`width: 100%`，`margin-bottom: 15px`
- **链接列表**：使用 `display: flex` 和 `flex-wrap: wrap`，`gap: 15px`，`align-items: center`
- **链接项**：每个 `<li>` 使用 `display: flex` 和 `align-items: center` 确保垂直对齐
- **链接文字**：`white-space: nowrap` 防止换行，`line-height: 1.5` 统一行高

### 二维码区域对齐规范
- **容器布局**：使用 `display: flex`，`gap: 30px`，`justify-content: flex-start`
- **每个二维码项目**：
  - 固定宽度：`width: 120px`
  - 布局方式：`display: flex`，`flex-direction: column`，`align-items: center`
  - 文本对齐：`text-align: center`
- **标题样式**：
  - `text-align: center` 居中对齐
  - `white-space: nowrap` 防止换行
  - `width: 100%`，`line-height: 1.4`
  - `margin-bottom: 15px`
- **二维码图片**：
  - 统一尺寸：`100px × 100px`
  - 使用 `object-fit: contain` 保持比例
  - `display: block`，`margin: 0 auto` 水平居中
- **二维码容器**：
  - `display: flex`，`flex-direction: column`，`align-items: center`
  - `width: 100%`，`margin-top: 0`
- **提示文字**（仅第四个二维码）：
  - `max-width: 120px` 与容器宽度一致
  - `text-align: center` 居中对齐
  - `font-size: 12px`，`line-height: 1.5`

### 响应式设计规范
- **移动端（≤768px）**：
  - 二维码容器：`flex-wrap: wrap`，`gap: 20px`，`justify-content: center`
  - 二维码项目：`width: 100px`
  - 二维码图片：`width: 80px`，`height: 80px`
  - 提示文字：`max-width: 100px`，`font-size: 11px`

### 注意事项
- 所有二维码必须严格对齐，标题、图片、提示文字都要居中对齐
- 友情链接标题左对齐，链接列表水平排列且对齐
- 已移除适老化无障碍服务图片，页脚不再包含该元素
