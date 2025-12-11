# 12306 订单页 UI 复刻规范（Train Order Page）

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_train_order/css/iconfont.css
  - assets/kyfw_12306_train_order/css/ticket_index_v70004.css
  - assets/kyfw_12306_train_order/css/toolbar.css
  - assets/kyfw_12306_train_order/css/toolbarmain.css
- 图片
  - assets/kyfw_12306_train_order/images/queue.gif
  - assets/kyfw_12306_train_order/images/empty.png
  - assets/kyfw_12306_train_order/images/link05.png
  - assets/kyfw_12306_train_order/images/link02.png
  - assets/kyfw_12306_train_order/images/link03.png
  - assets/kyfw_12306_train_order/images/link04.png
  - assets/kyfw_12306_train_order/images/zgtlwb.png
  - assets/kyfw_12306_train_order/images/zgtlwx.png
  - assets/kyfw_12306_train_order/images/public.png
  - assets/kyfw_12306_train_order/images/download.png
  - assets/kyfw_12306_train_order/images/gongan.png
  - assets/kyfw_12306_train_order/images/footer-slh.jpg
  - assets/kyfw_12306_train_order/images/loading.gif

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
    "error": "#E12525",
    "warning": "#FF9027",
    "textPrimary": "#333333",
    "textSecondary": "#666666",
    "textMuted": "#999999",
    "borderDefault": "#DADADA",
    "bgLight": "#F8F8F8",
    "bgPanel": "#EAEDED",
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
          {"type": "h1", "class": "logo"},
          {"type": "div", "class": "header-right"}
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
    "margin": "0 auto"
  },
  "navBoxStyles": {
    "width": "100%",
    "height": "40px",
    "backgroundColor": "#3B99FC"
  }
}
```

示例代码
```html
<div class="header">
  <div class="wrapper">
    <div class="header-con">
      <h1 class="logo">
         <img src="assets/kyfw_12306_train_order/images/logo.png" alt="12306 Logo" />
      </h1>
      <div class="header-right">
        <!-- Search & User Info -->
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
  "menuItemStyles": {
    "marginBottom": "4px",
    "display": "block"
  },
  "menuTitStyles": {
    "height": "30px",
    "lineHeight": "30px",
    "padding": "0 10px",
    "backgroundColor": "#F8F8F8",
    "color": "#333333",
    "fontWeight": "bold"
  },
  "menuSubItemStyles": {
    "height": "30px",
    "lineHeight": "30px",
    "paddingLeft": "20px",
    "color": "#666666",
    "cursor": "pointer"
  },
  "activeItemStyles": {
    "color": "#3B99FC",
    "backgroundColor": "#E5F2FF"
  }
}
```

## Order Tabs (订单标签页) 组件
```json
{
  "componentName": "OrderTabs",
  "structure": {
    "type": "div",
    "class": "tab-hd",
    "children": [
      {"type": "ul", "class": "tab-hd-list"}
    ]
  },
  "styles": {
    "width": "100%",
    "height": "44px",
    "borderBottom": "2px solid #3B99FC"
  },
  "tabItemStyles": {
    "float": "left",
    "height": "42px",
    "lineHeight": "42px",
    "padding": "0 30px",
    "cursor": "pointer",
    "fontSize": "16px",
    "color": "#333333"
  },
  "activeTabStyles": {
    "backgroundColor": "#3B99FC",
    "color": "#FFFFFF"
  }
}
```

## Search Panel (查询面板) 组件
```json
{
  "componentName": "SearchPanel",
  "structure": {
    "type": "div",
    "class": "search-form-mini",
    "children": [
      {
        "type": "div",
        "class": "form-item",
        "label": "乘车日期",
        "children": [
           {"type": "input", "class": "input-data", "placeholder": "起始日期"},
           {"type": "span", "text": "-"},
           {"type": "input", "class": "input-data", "placeholder": "结束日期"}
        ]
      },
      {
        "type": "div",
        "class": "form-item",
        "label": "订单号/车次/姓名",
        "children": [
           {"type": "input", "class": "input-text", "width": "160px"}
        ]
      },
      {
        "type": "button",
        "class": "btn",
        "text": "查询"
      }
    ]
  },
  "styles": {
    "padding": "10px 0",
    "marginBottom": "20px"
  },
  "inputStyles": {
    "height": "30px",
    "border": "1px solid #CCCCCC",
    "padding": "0 5px"
  },
  "buttonStyles": {
    "width": "100px",
    "height": "30px",
    "backgroundColor": "#FF8000",
    "color": "#FFFFFF",
    "border": "none",
    "cursor": "pointer",
    "borderRadius": "4px"
  }
}
```

## Order Table (订单列表) 组件
```json
{
  "componentName": "OrderTable",
  "structure": {
    "type": "table",
    "class": "order-panel-head",
    "children": [
      {
        "type": "thead",
        "children": [
           {"type": "th", "text": "车次信息", "width": "220px"},
           {"type": "th", "text": "旅客信息", "width": "170px"},
           {"type": "th", "text": "席位信息", "width": "150px"},
           {"type": "th", "text": "票价", "width": "160px"},
           {"type": "th", "text": "车票状态", "width": "140px"},
           {"type": "th", "text": "操作"}
        ]
      }
    ]
  },
  "styles": {
    "width": "100%",
    "borderCollapse": "collapse",
    "backgroundColor": "#F8F8F8"
  },
  "headerStyles": {
    "height": "40px",
    "backgroundColor": "#F0F0F0",
    "color": "#333333",
    "fontSize": "14px",
    "textAlign": "center",
    "borderBottom": "1px solid #E0E0E0"
  },
  "cellStyles": {
    "padding": "10px",
    "borderBottom": "1px solid #E0E0E0",
    "textAlign": "center"
  }
}
```

示例代码
```html
<div class="order-list">
  <div class="tab-hd">
    <ul class="tab-hd-list">
      <li class="active">未完成订单</li>
      <li>未出行订单</li>
      <li>历史订单</li>
    </ul>
  </div>
  <div class="tab-bd">
    <!-- Empty State -->
    <div class="order-empty">
       <img src="assets/kyfw_12306_train_order/images/empty.png" alt="No Orders" />
       <p>您没有未完成的订单哦～</p>
    </div>
    
    <!-- Table Header (Hidden when empty) -->
    <table class="order-panel-head" style="display:none;">
       <colgroup>
         <col class="col-train" width="220">
         <col class="col-passenger" width="170">
         <col class="col-seat" width="150">
         <col class="col-price" width="160">
         <col class="col-state" width="140">
         <col>
       </colgroup>
       <tbody>
         <tr>
           <th>车次信息</th>
           <th>旅客信息</th>
           <th>席位信息</th>
           <th>票价</th>
           <th>车票状态</th>
           <th>操作</th>
         </tr>
       </tbody>
    </table>
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
    "width": "100%",
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
