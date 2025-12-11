# 12306 常用联系人页 UI 复刻规范 (Passenger Page)

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_passengers/css/iconfont.css
  - assets/kyfw_12306_passengers/css/ticket_public_v70001.css
  - assets/kyfw_12306_passengers/css/toolbar.css
  - assets/kyfw_12306_passengers/css/toolbarmain.css
- 图片
  - assets/kyfw_12306_passengers/images/link05.png
  - assets/kyfw_12306_passengers/images/link02.png
  - assets/kyfw_12306_passengers/images/link03.png
  - assets/kyfw_12306_passengers/images/link04.png
  - assets/kyfw_12306_passengers/images/zgtlwb.png
  - assets/kyfw_12306_passengers/images/zgtlwx.png
  - assets/kyfw_12306_passengers/images/public.png
  - assets/kyfw_12306_passengers/images/download.png
  - assets/kyfw_12306_passengers/images/gongan.png
  - assets/kyfw_12306_passengers/images/footer-slh.jpg

## 全局样式 JSON
```json
{
  "componentName": "Global",
  "styles": {
    "fontFamily": "\"Segoe UI\", sans-serif",
    "fontSize": "14px",
    "color": "#333333",
    "backgroundColor": "#FFFFFF",
    "lineHeight": "21px"
  },
  "palette": {
    "primary": "#FF8000",
    "secondary": "#3B99FC",
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
    "color": "#333333",
    "padding": "0",
    "margin": "0 auto"
  }
}
```

示例代码
```html
<div class="header">
  <div class="wrapper">
    <div class="header-con">
      <h1 class="logo">
         <img src="assets/kyfw_12306_passengers/images/logo.png" alt="12306 Logo" />
      </h1>
      <!-- Search and Nav omitted for brevity, similar to info page -->
    </div>
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
    "height": "auto",
    "backgroundColor": "transparent",
    "color": "#333333",
    "padding": "0",
    "margin": "0"
  }
}
```

## Main Content (Passenger List) 组件

### Search Area
```json
{
  "componentName": "PassengerSearch",
  "structure": {
    "type": "div",
    "class": "search-box",
    "children": [
      {
        "type": "input",
        "id": "_search_name",
        "placeholder": "请输入乘客姓名"
      },
      {
        "type": "button",
        "id": "serch_btn",
        "text": "查询"
      }
    ]
  },
  "styles": {
    "width": "100%",
    "padding": "10px 0"
  },
  "inputStyles": {
    "width": "160px",
    "height": "30px",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #DEDEDE",
    "padding": "4px 10px",
    "fontSize": "14px",
    "color": "#333333"
  },
  "buttonStyles": {
    "width": "100px",
    "height": "30px",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #DEDEDE",
    "padding": "4px 10px",
    "cursor": "pointer",
    "fontSize": "14px"
  }
}
```

### Action Buttons
```json
{
  "componentName": "ActionButtons",
  "children": [
    {
      "element": "AddButton",
      "text": "添加",
      "styles": {
        "backgroundColor": "#FF8000",
        "color": "#FFFFFF",
        "border": "1px solid #FF8000",
        "height": "30px",
        "padding": "4px 15px",
        "borderRadius": "4px"
      }
    }
  ]
}
```

### Passenger Table
```json
{
  "componentName": "PassengerTable",
  "structure": {
    "type": "table",
    "class": "order-panel-head",
    "children": [
      {
        "type": "thead",
        "children": [
          {
            "type": "tr",
            "children": ["序号", "姓名", "证件类型", "证件号码", "手机／电话", "核验状态", "操作"]
          }
        ]
      },
      {
        "type": "tbody",
        "children": [
          {
             "type": "tr",
             "class": "passenger-row",
             "children": ["1", "张三", "居民身份证", "1101************1234", "138****1234", "已通过", "删除"]
          }
        ]
      }
    ]
  },
  "styles": {
    "width": "988px",
    "backgroundColor": "#F8F8F8",
    "borderCollapse": "collapse"
  },
  "headerStyles": {
    "height": "40px",
    "backgroundColor": "#F8F8F8",
    "color": "#333333",
    "textAlign": "center",
    "fontWeight": "400"
  },
  "rowStyles": {
    "height": "40px",
    "borderBottom": "1px dashed #DEDEDE",
    "textAlign": "center"
  }
}
```

示例代码
```html
<div class="center-main">
  <!-- Search -->
  <div class="search-box">
     <input type="text" id="_search_name" class="input" placeholder="请输入乘客姓名" />
     <a id="serch_btn" class="btn">查询</a>
  </div>

  <!-- Table -->
  <table class="order-panel-head">
    <thead>
      <tr>
        <th class="col-num">序号</th>
        <th class="col-name">姓名</th>
        <th class="col-cardtype">证件类型</th>
        <th class="col-cardnum">证件号码</th>
        <th class="col-tel">手机／电话</th>
        <th class="col-status">核验状态</th>
        <th class="col-opt">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>张三</td>
        <td>居民身份证</td>
        <td>1101************1234</td>
        <td>138****1234</td>
        <td>已通过</td>
        <td><a href="#">删除</a></td>
      </tr>
    </tbody>
  </table>
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
