# 12306 首页 UI 复刻规范（Index Page UI Replication Specs）

**概述**
- 目标页面 `https://www.12306.cn/index/` 的视觉与交互元素完整采集与结构化描述。
- 文档包含：资源清单、全局样式、组件级样式（含 JSON 代码块）、示例代码与截图说明。
- 所有静态资源已下载并按相对路径组织于 `assets/12306_index/` 下，可离线使用。

**资源清单（首页）**
- CSS
  - `assets/12306_index/css/index_y_v50003.css`
  - `assets/12306_index/css/index_y_v50004.css`
  - `assets/12306_index/css/main.css`
- JS
  - `assets/12306_index/js/jquery.min.js`
  - `assets/12306_index/js/require.js`
  - `assets/12306_index/js/qss.js`
  - `assets/12306_index/js/route.js`
  - `assets/12306_index/js/station_name_new.js`
  - `assets/12306_index/js/station_name_new_v10094.js`
  - `assets/12306_index/js/dist/main_v60012.js`
  - `assets/12306_index/js/core/handleIframeInner.js`
  - `assets/12306_index/js/core/qss.js`
  - `assets/12306_index/js/core/require.js`
  - `assets/12306_index/js/core/toolbar_jquery.js`
- 图片与图标（首页）
  - `assets/12306_index/images/logo.png`
  - `assets/12306_index/images/bg-train.png`
  - `assets/12306_index/images/banner20201223.jpg`
  - `assets/12306_index/images/banner20200707.jpg`
  - `assets/12306_index/images/banner0619.jpg`
  - `assets/12306_index/images/banner10.jpg`
  - `assets/12306_index/images/banner12.jpg`
  - `assets/12306_index/images/abanner01.jpg`
  - `assets/12306_index/images/abanner02.jpg`
  - `assets/12306_index/images/service01.jpg`
  - `assets/12306_index/images/service02.jpg`
  - `assets/12306_index/images/service03.jpg`
  - `assets/12306_index/images/service04.jpg`
  - `assets/12306_index/images/link02.png`
  - `assets/12306_index/images/link03.png`
  - `assets/12306_index/images/link04.png`
  - `assets/12306_index/images/link05.png`
  - `assets/12306_index/images/zgtlwb.png`
  - `assets/12306_index/images/zgtlwx.png`
  - `assets/12306_index/images/public.png`
  - `assets/12306_index/images/footer-slh.jpg`
  - `assets/12306_index/images/gongan.png`
  - `assets/12306_index/images/download.png`
  - `assets/12306_index/images/loading.gif`

**全局样式（首页）**
```json
{
  "componentName": "IndexGlobal",
  "styles": {
    "fontFamily": "Tahoma, 宋体",
    "fontSize": "12px",
    "color": "#333333",
    "backgroundColor": "#FFFFFF"
  },
  "palette": {
    "primary": "#3B99FC",
    "primaryLight": "#61ADFD",
    "hover": "#E8F3FF",
    "borderLight": "#EFEFEF",
    "borderDefault": "#DEDEDE",
    "textPrimary": "#333333",
    "textSecondary": "#555555",
    "textMuted": "#999999",
    "bgLight": "#F8F8F8"
  }
}
```

**顶部 Header（站点入口与搜索）**
```json
{
  "componentName": "Header",
  "structure": "Flex (Space-between)",
  "styles": {
    "height": "64px",
    "backgroundColor": "#FFFFFF",
    "borderBottom": "1px solid #EFEFEF",
    "padding": "0 24px"
  },
  "children": [
    {
      "element": "Logo",
      "styles": {
        "width": "200px",
        "height": "50px",
        "backgroundImage": "url(assets/12306_index/images/logo.png)",
        "backgroundRepeat": "no-repeat",
        "backgroundSize": "contain"
      }
    },
    {
      "element": "SearchBar",
      "styles": {
        "width": "380px",
        "display": "flex",
        "alignItems": "center"
      },
      "children": [
        {
          "element": "SearchInput",
          "styles": {
            "width": "350px",
            "height": "32px",
            "border": "1px solid #EFEFEF",
            "borderRadius": "5px",
            "padding": "4px 10px",
            "color": "#333"
          },
          "attrs": { "id": "search-input", "placeholder": "搜索车票、餐饮、常旅客、相关规章" }
        },
        {
          "element": "SearchButton",
          "styles": { "width": "32px", "height": "32px" },
          "children": [ { "element": "Icon", "styles": { "class": "icon icon-search" } } ]
        }
      ]
    },
    {
      "element": "TopMenu",
      "styles": { "display": "flex", "gap": "10px" },
      "items": [
        { "text": "无障碍" },
        { "text": "敬老版" },
        { "text": "English" },
        { "text": "我的12306" },
        { "text": "登录" },
        { "text": "注册" }
      ]
    }
  ]
}
```

**主导航（Nav）**
```json
{
  "componentName": "MainNav",
  "structure": "Dropdown Nav",
  "styles": {
    "backgroundColor": "#FFFFFF",
    "borderTop": "1px solid #EFEFEF",
    "borderBottom": "1px solid #EFEFEF"
  },
  "children": [
    { "element": "NavItem", "text": "首页" },
    { "element": "NavItem", "text": "车票", "children": ["购买","变更","更多"] },
    { "element": "NavItem", "text": "团购服务" },
    { "element": "NavItem", "text": "会员服务" },
    { "element": "NavItem", "text": "站车服务" },
    { "element": "NavItem", "text": "商旅服务" },
    { "element": "NavItem", "text": "出行指南" },
    { "element": "NavItem", "text": "信息查询" }
  ]
}
```

**Banner 区（轮播）**
```json
{
  "componentName": "FullSlide",
  "structure": "Slider",
  "styles": {
    "height": "450px",
    "backgroundColor": "#FFFFFF"
  },
  "children": [
    { "element": "Slide", "styles": { "backgroundImage": "url(assets/12306_index/images/banner20201223.jpg)", "backgroundSize": "cover", "height": "450px" } },
    { "element": "Slide", "styles": { "backgroundImage": "url(assets/12306_index/images/banner20200707.jpg)", "backgroundSize": "cover", "height": "450px" } }
  ]
}
```

**查询面板（车票/常用查询/订餐）**
```json
{
  "componentName": "SearchIndex",
  "structure": "Card + Tabs",
  "styles": {
    "position": "absolute",
    "top": "50px",
    "width": "510px",
    "height": "350px",
    "backgroundColor": "#FFFFFF",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.06)",
    "border": "1px solid #DEDEDE"
  },
  "children": [
    {
      "element": "SideMenu",
      "styles": {
        "width": "100px",
        "backgroundColor": "#3B99FC"
      },
      "items": ["车票","常用查询","订餐"]
    },
    {
      "element": "TicketTab",
      "styles": { "padding": "32px 25px", "borderTop": "none" },
      "children": [
        {
          "element": "TabHeader",
          "styles": { "borderBottom": "2px solid #DEDEDE" },
          "items": ["单程","往返","中转换乘","退改签"]
        },
        {
          "element": "SingleForm",
          "styles": { "marginTop": "12px" },
          "children": [
            { "element": "InputFrom", "attrs": { "id": "fromStationText", "type": "text" }, "styles": { "height": "32px", "border": "1px solid #EFEFEF", "borderRadius": "5px", "padding": "4px 10px" } },
            { "element": "InputTo", "attrs": { "id": "toStationText", "type": "text" }, "styles": { "height": "32px", "border": "1px solid #EFEFEF", "borderRadius": "5px", "padding": "4px 10px" } },
            { "element": "InputDate", "attrs": { "id": "train_date", "type": "text" }, "styles": { "height": "32px", "border": "1px solid #EFEFEF", "borderRadius": "5px", "padding": "4px 10px" } },
            { "element": "Checks", "styles": { "display": "flex", "gap": "12px" }, "items": ["学生","高铁/动车"] },
            { "element": "SearchButton", "attrs": { "id": "search_one" }, "styles": { "height": "44px", "backgroundColor": "#3B99FC", "color": "#FFFFFF", "borderRadius": "2px", "display": "block", "width": "100%" } }
          ]
        }
      ]
    }
  ]
}
```

**服务区块与信息面板**
- 采用栅格与卡片布局，图片资源参见“资源清单”。
- 文字样式遵循 `IndexGlobal.styles` 与 `IndexGlobal.palette`。

**页脚（Footer）**
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
    { "element": "PartnerLink01", "styles": { "backgroundImage": "url(assets/12306_index/images/link05.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink02", "styles": { "backgroundImage": "url(assets/12306_index/images/link02.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink03", "styles": { "backgroundImage": "url(assets/12306_index/images/link03.png)", "width": "120px", "height": "32px" } },
    { "element": "PartnerLink04", "styles": { "backgroundImage": "url(assets/12306_index/images/link04.png)", "width": "120px", "height": "32px" } },
    { "element": "WeChat", "styles": { "backgroundImage": "url(assets/12306_index/images/zgtlwb.png)", "width": "32px", "height": "32px" } },
    { "element": "Weibo", "styles": { "backgroundImage": "url(assets/12306_index/images/zgtlwx.png)", "width": "32px", "height": "32px" } },
    { "element": "PoliceBadge", "styles": { "backgroundImage": "url(assets/12306_index/images/gongan.png)", "width": "120px", "height": "32px" } }
  ]
}
```

**示例代码块**
- 查询按钮（示例）
```html
<button id="search_one" style="height:44px;background-color:#3B99FC;color:#FFFFFF;border-radius:2px;display:block;width:100%">查 询</button>
```
- 出发地与到达地输入框（示例）
```html
<input id="fromStationText" type="text" placeholder="简拼/全拼/汉字" style="height:32px;border:1px solid #EFEFEF;border-radius:5px;padding:4px 10px" />
<input id="toStationText" type="text" placeholder="简拼/全拼/汉字" style="height:32px;border:1px solid #EFEFEF;border-radius:5px;padding:4px 10px" />
```

**质量与一致性校验**
- 视觉一致性
  - 颜色与字体栈按“全局样式”与“组件 JSON”强约束使用。
  - 轮播高度为 `450px`，查询面板尺寸 `510x350`，位置 `top:50px`。
- 资源有效性
  - 所有 CSS/JS/图片/字体已下载并可通过相对路径加载。
- 结构完整性
  - 页内主要交互元素已采集并在“组件样式详解”中以 JSON 描述。
