# 12306 个人信息页 UI 复刻规范 (Information Page)

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_information/css/iconfont.css
  - assets/kyfw_12306_information/css/information_v70001.css
  - assets/kyfw_12306_information/css/toolbar.css
  - assets/kyfw_12306_information/css/toolbarmain.css
- 图片
  - assets/kyfw_12306_information/images/person03.jpg
  - assets/kyfw_12306_information/images/person04.jpg
  - assets/kyfw_12306_information/images/person06.png
  - assets/kyfw_12306_information/images/link05.png
  - assets/kyfw_12306_information/images/link02.png
  - assets/kyfw_12306_information/images/link03.png
  - assets/kyfw_12306_information/images/link04.png
  - assets/kyfw_12306_information/images/zgtlwb.png
  - assets/kyfw_12306_information/images/zgtlwx.png
  - assets/kyfw_12306_information/images/public.png
  - assets/kyfw_12306_information/images/download.png
  - assets/kyfw_12306_information/images/gongan.png
  - assets/kyfw_12306_information/images/footer-slh.jpg
  - assets/kyfw_12306_information/images/loading.gif

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
    "primary": "#3B99FC",
    "secondary": "#FF8000",
    "textPrimary": "#333333",
    "textSecondary": "#666666",
    "borderDefault": "#DEDEDE",
    "bgLight": "#F8F8F8"
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
          {"type": "h1", "class": "logo"},
          {
            "type": "div", 
            "class": "header-right",
            "children": [
               {"type": "input", "class": "search-input", "placeholder": "搜索车票/餐饮..."}
            ]
          }
        ]
      },
      {
        "type": "div",
        "class": "nav-box",
        "children": [
          {"type": "ul", "class": "nav"}
        ]
      }
    ]
  },
  "styles": {
    "width": "1200px",
    "height": "120px",
    "backgroundColor": "#FFFFFF",
    "margin": "0 auto"
  },
  "navBoxStyles": {
    "width": "100%",
    "height": "40px",
    "backgroundColor": "#3B99FC"
  },
  "searchInputStyles": {
    "height": "30px",
    "border": "1px solid #DEDEDE",
    "padding": "4px 10px",
    "borderRadius": "0px",
    "fontSize": "14px"
  }
}
```

示例代码
```html
<div class="header">
  <div class="wrapper">
    <div class="header-con">
      <h1 class="logo">
         <img src="assets/kyfw_12306_information/images/logo.png" alt="12306 Logo" />
      </h1>
      <div class="header-right">
        <div class="search-bd">
           <input type="text" class="search-input" placeholder="搜索车票/餐饮/常旅客/相关规章" />
        </div>
      </div>
    </div>
  </div>
  <div class="nav-box">
    <ul class="nav">
      <li class="nav-item active">首页</li>
      <li class="nav-item">车票</li>
      <li class="nav-item">团购服务</li>
      <li class="nav-item">会员服务</li>
      <li class="nav-item">站车服务</li>
      <li class="nav-item">商旅服务</li>
      <li class="nav-item">出行指南</li>
      <li class="nav-item last">信息查询</li>
    </ul>
  </div>
</div>
```

## Sidebar (Center Menu) 组件
```json
{
  "componentName": "Sidebar",
  "structure": {
    "type": "ul",
    "class": "center-menu",
    "children": [
      {
        "type": "li",
        "class": "menu-item",
        "children": [
          {"type": "h2", "class": "menu-tit", "text": "个人中心"},
          {"type": "ul", "class": "menu-sub"}
        ]
      }
    ]
  },
  "styles": {
    "width": "130px",
    "backgroundColor": "transparent"
  },
  "menuTitStyles": {
    "height": "30px",
    "lineHeight": "30px",
    "padding": "0 10px",
    "color": "#333333",
    "fontWeight": "700",
    "fontSize": "14px"
  },
  "menuItemStyles": {
    "height": "30px",
    "lineHeight": "30px",
    "padding": "0",
    "color": "#333333",
    "display": "block"
  },
  "activeItemStyles": {
    "backgroundColor": "#3B99FC",
    "color": "#FFFFFF"
  }
}
```

## Information Form (Main Content) 组件
```json
{
  "componentName": "InformationForm",
  "structure": {
    "type": "div",
    "class": "center-main",
    "children": [
      {
        "type": "form",
        "children": [
           {
             "type": "div", 
             "class": "form-item",
             "children": [
                {"type": "div", "class": "form-label", "text": "Label:"},
                {"type": "div", "class": "form-bd", "text": "Value"}
             ]
           },
           {
             "type": "button",
             "class": "btn btn-edit",
             "text": "编辑"
           }
        ]
      }
    ]
  },
  "styles": {
    "width": "1030px",
    "padding": "0",
    "backgroundColor": "transparent"
  },
  "formItemStyles": {
    "marginBottom": "10px",
    "height": "30px",
    "lineHeight": "30px",
    "display": "block"
  },
  "labelStyles": {
    "width": "auto", 
    "float": "left",
    "textAlign": "right",
    "marginRight": "5px",
    "color": "#333333"
  },
  "valueStyles": {
    "float": "left",
    "color": "#333333"
  },
  "buttonStyles": {
    "width": "80px",
    "height": "30px",
    "backgroundColor": "#FFFFFF",
    "color": "#333333",
    "border": "1px solid #DEDEDE",
    "borderRadius": "6px",
    "cursor": "pointer",
    "padding": "4px 10px"
  }
}
```

示例代码
```html
<div class="center-main" id="informationView">
  <form>
    <!-- Section Title if exists -->
    <div class="form-item">
      <div class="form-label"><span class="required">*</span>用户名：</div>
      <div class="form-bd">
         <div class="form-bd-txt">username123</div>
      </div>
    </div>
    <div class="form-item">
      <div class="form-label"><span class="required">*</span>姓名：</div>
      <div class="form-bd">
         <div class="form-bd-txt">张三</div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="form-item">
       <button type="button" class="btn btn-edit">编辑</button>
    </div>
  </form>
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
        "class": "foot-links",
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
    "backgroundColor": "#F8F8F8",
    "padding": "40px 0",
    "marginTop": "40px"
  },
  "textStyles": {
    "color": "#999999",
    "fontSize": "12px",
    "textAlign": "center",
    "lineHeight": "24px"
  }
}
```
