# 12306 手机核验页 UI 复刻规范（Bind Tel Page）

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_bind_tel/css/iconfont.css
  - assets/kyfw_12306_bind_tel/css/ticket_common_v70001.css
  - assets/kyfw_12306_bind_tel/css/toolbar.css
  - assets/kyfw_12306_bind_tel/css/toolbarmain.css
- 图片
  - assets/kyfw_12306_bind_tel/images/link05.png
  - assets/kyfw_12306_bind_tel/images/link02.png
  - assets/kyfw_12306_bind_tel/images/link03.png
  - assets/kyfw_12306_bind_tel/images/link04.png
  - assets/kyfw_12306_bind_tel/images/zgtlwb.png
  - assets/kyfw_12306_bind_tel/images/zgtlwx.png
  - assets/kyfw_12306_bind_tel/images/public.png
  - assets/kyfw_12306_bind_tel/images/download.png
  - assets/kyfw_12306_bind_tel/images/gongan.png
  - assets/kyfw_12306_bind_tel/images/footer-slh.jpg
  - assets/kyfw_12306_bind_tel/images/loading.gif

## 全局样式 JSON
```json
{
  "componentName": "Global",
  "styles": {
    "fontFamily": "\"Helvetica Neue\", Helvetica, Arial, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", \"WenQuanYi Micro Hei\", sans-serif",
    "fontSize": "14px",
    "color": "#333333",
    "backgroundColor": "#FFFFFF",
    "lineHeight": "21px"
  },
  "palette": {
    "primary": "#FF8000",
    "secondary": "#FFFFFF",
    "textPrimary": "#333333",
    "textSecondary": "#666666",
    "borderDefault": "#DEDEDE",
    "bgLight": "#F8F8F8",
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
        "type": "div",
        "class": "header-con",
        "children": [
          {"type": "h1", "class": "logo", "text": "中国铁路12306"},
          {"type": "div", "class": "header-right", "text": "我的12306 | 您好， 林瑞"}
        ]
      }
    ]
  },
  "styles": {
    "width": "1200px",
    "height": "120px",
    "backgroundColor": "#FFFFFF",
    "color": "#333333",
    "margin": "0 auto",
    "position": "relative"
  }
}
```

示例代码
```html
<div class="header">
  <div class="header-con">
    <h1 class="logo">
       <!-- Logo image usually here -->
       中国铁路12306
    </h1>
    <div class="header-right">
       <!-- User Info & Nav Links -->
    </div>
  </div>
</div>
```

## Bind Tel Form (手机核验表单) 组件
```json
{
  "componentName": "BindTelForm",
  "structure": {
    "type": "div",
    "class": "content",
    "children": [
      {
        "type": "div",
        "class": "form-item",
        "children": [
             {"type": "label", "text": "手机号"},
             {"type": "input", "class": "input", "placeholder": "请输入手机号"},
             {"type": "button", "class": "btn", "text": "修改手机号"}
        ]
      },
      {
        "type": "div",
        "class": "form-item",
        "children": [
             {"type": "label", "text": "验证码"},
             {"type": "input", "class": "input-check", "placeholder": "验证码"},
             {"type": "button", "class": "btn-primary", "text": "核验"}
        ]
      },
      {
         "type": "div",
         "class": "actions",
         "children": [
             {"type": "button", "class": "btn cancel-btn", "text": "取消"},
             {"type": "button", "class": "btn btn-primary", "text": "确认"}
         ]
      }
    ]
  },
  "styles": {
    "width": "100%",
    "padding": "20px"
  },
  "inputStyles": {
    "width": "200px",
    "height": "30px",
    "border": "1px solid #DEDEDE",
    "padding": "4px 10px",
    "borderRadius": "4px",
    "backgroundColor": "#FFFFFF",
    "color": "#333333"
  },
  "buttonPrimaryStyles": {
    "width": "80px",
    "height": "30px",
    "backgroundColor": "#FF8000",
    "color": "#FFFFFF",
    "border": "1px solid #FF8000",
    "borderRadius": "6px",
    "cursor": "pointer"
  },
  "buttonSecondaryStyles": {
    "width": "80px",
    "height": "30px",
    "backgroundColor": "#FFFFFF",
    "color": "#333333",
    "border": "1px solid #DEDEDE",
    "borderRadius": "6px",
    "cursor": "pointer"
  }
}
```

示例代码
```html
<div class="bind-tel-form">
   <div class="form-row">
      <input type="text" class="input" placeholder="手机号" />
      <button class="btn">修改手机号</button>
   </div>
   <div class="form-row">
      <input type="text" class="input-check" placeholder="验证码" />
      <button class="btn btn-primary">核验</button>
   </div>
   <div class="form-actions">
      <button class="btn cancel-btn">取消</button>
      <button class="btn btn-primary">确认</button>
   </div>
</div>
```

## Footer 组件
```json
{
  "componentName": "Footer",
  "structure": {
    "type": "footer",
    "children": [
      {
        "type": "div",
        "class": "footer-links",
        "children": [
           {"type": "h2", "text": "友情链接"},
           {"type": "ul", "children": [{"type": "li", "type": "img"}]}
        ]
      },
      {
        "type": "div",
        "class": "footer-txt",
        "children": [
           {"type": "p", "text": "版权所有©2008-2024 中国铁道科学研究院集团有限公司"}
        ]
      }
    ]
  },
  "styles": {
    "width": "1200px",
    "height": "274px",
    "backgroundColor": "#F8F8F8",
    "color": "#333333",
    "marginTop": "40px",
    "padding": "40px 0",
    "fontSize": "14px"
  }
}
```
