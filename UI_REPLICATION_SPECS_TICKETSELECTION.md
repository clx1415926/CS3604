# 12306 车票查询页 UI 复刻规范（LeftTicket）

## 资源清单（本地相对路径）
- CSS
  - assets/kyfw_12306_ticketselection/css/validation.css
  - assets/kyfw_12306_ticketselection/css/common_css.css_cssVersion_1.9093
  - assets/kyfw_12306_ticketselection/css/queryLeftTicket_css.css_cssVersion_1.9093
  - assets/kyfw_12306_ticketselection/css/queryLeftTicket_end_css.css_cssVersion_1.9093
  - assets/kyfw_12306_ticketselection/css/calendarNew.css
  - assets/kyfw_12306_ticketselection/css/WdatePicker.css
  - assets/kyfw_12306_ticketselection/css/iconfont.css
  - assets/kyfw_12306_ticketselection/toolbar/css/toolbar.css
  - assets/kyfw_12306_ticketselection/toolbar/css/toolbarmain.css
- JS
  - assets/kyfw_12306_ticketselection/js/common_js.js_scriptVersion_1.95000
  - assets/kyfw_12306_ticketselection/js/queryLeftTicket_js.js_scriptVersion_1.95000
  - assets/kyfw_12306_ticketselection/js/queryLeftTicket_end_js.js_scriptVersion_1.95000
  - assets/kyfw_12306_ticketselection/js/WdatePicker.js
  - assets/kyfw_12306_ticketselection/js/station_name.js_station_version_1.9359
  - assets/kyfw_12306_ticketselection/js/favorite_name.js
  - assets/kyfw_12306_ticketselection/js/data.jcalendar.js
  - assets/kyfw_12306_ticketselection/js/jquery.SuperSlide.js
  - assets/kyfw_12306_ticketselection/js/jquery.cookie.js
  - assets/kyfw_12306_ticketselection/js/jquery.bgiframe.mi.js
  - assets/kyfw_12306_ticketselection/js/jquery.fly.min.js
  - assets/kyfw_12306_ticketselection/js/requestAnimationFrame.js
  - assets/kyfw_12306_ticketselection/js/base64js.min.js
  - assets/kyfw_12306_ticketselection/js/SM4.js
  - assets/kyfw_12306_ticketselection/js/qmnphme
  - assets/kyfw_12306_ticketselection/toolbar/js/jquery.js
  - assets/kyfw_12306_ticketselection/toolbar/js/base64.js
  - assets/kyfw_12306_ticketselection/toolbar/js/pinyin.js
  - assets/kyfw_12306_ticketselection/toolbar/js/soundmanager2.js
  - assets/kyfw_12306_ticketselection/toolbar/js/toolbar.js
  - assets/kyfw_12306_ticketselection/toolbar/js/route.js
  - assets/kyfw_12306_ticketselection/toolbar/js/handleInnerIframe.js
- 图片
  - assets/kyfw_12306_ticketselection/images/logo.png（如需）
  - assets/kyfw_12306_ticketselection/images/link02.png
  - assets/kyfw_12306_ticketselection/images/link03.png
  - assets/kyfw_12306_ticketselection/images/link04.png
  - assets/kyfw_12306_ticketselection/images/link05.png
  - assets/kyfw_12306_ticketselection/images/zgtlwb.png
  - assets/kyfw_12306_ticketselection/images/zgtlwx.png
  - assets/kyfw_12306_ticketselection/images/public.png
  - assets/kyfw_12306_ticketselection/images/download.png
  - assets/kyfw_12306_ticketselection/images/gongan.png
  - assets/kyfw_12306_ticketselection/images/footer-slh.jpg
  - assets/kyfw_12306_ticketselection/images/bg.png
  - assets/kyfw_12306_ticketselection/images/bg02.png
  - assets/kyfw_12306_ticketselection/images/bg_btn.png
  - assets/kyfw_12306_ticketselection/images/icon.png
  - assets/kyfw_12306_ticketselection/images/icon02.png
  - assets/kyfw_12306_ticketselection/images/icon_add.png
  - assets/kyfw_12306_ticketselection/images/icon_arrow.png
  - assets/kyfw_12306_ticketselection/images/icon_sj01.png
  - assets/kyfw_12306_ticketselection/images/icon_sj02.png
  - assets/kyfw_12306_ticketselection/images/icon_sj03.png
  - assets/kyfw_12306_ticketselection/images/line_sear.png
  - assets/kyfw_12306_ticketselection/images/line_tlisth.png
  - assets/kyfw_12306_ticketselection/images/quick.png
  - assets/kyfw_12306_ticketselection/images/working.gif
  - assets/kyfw_12306_ticketselection/images/cart.png
  - assets/kyfw_12306_ticketselection/images/img.gif
  - assets/kyfw_12306_ticketselection/images/bg_return.png
  - assets/kyfw_12306_ticketselection/toolbar/img/reflash1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/reflash2.png
  - assets/kyfw_12306_ticketselection/toolbar/img/sound_normal.png
  - assets/kyfw_12306_ticketselection/toolbar/img/vol_normal.png
  - assets/kyfw_12306_ticketselection/toolbar/img/point2.png
  - assets/kyfw_12306_ticketselection/toolbar/img/color1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/enlarge1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/small1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/cursor1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/screen1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/help1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/left_img2.png
  - assets/kyfw_12306_ticketselection/toolbar/img/left_img5.png
  - assets/kyfw_12306_ticketselection/toolbar/img/toOriginal.png
  - assets/kyfw_12306_ticketselection/toolbar/img/exit1.png
  - assets/kyfw_12306_ticketselection/toolbar/img/top_pic.png

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
    "primary": "#348FF3",
    "secondary": "#FF8000",
    "accent": "#184F87",
    "textPrimary": "#333333",
    "textSecondary": "#666666",
    "textMuted": "#999999",
    "borderDefault": "#CFCDC7",
    "bgLight": "#F8F8F8"
  }
}
```

## Header / 搜索框
- 元素：输入框 `#search-input`（搜索车票、餐饮、常旅客、相关规章）
- 属性与样式
  - 类型：`input[type=text]`
  - ID/类名：`id="search-input" class="search-input"`
  - 文本：占位符 `搜索车票、餐饮、常旅客、相关规章`
  - 位置信息：`x=376.7, y=29, width=350, height=30`
  - 交互状态：可用
  - 样式描述：`font-size: 14px; color: #333333; background-color: #FFFFFF; border: 1px solid #EFEFEF; padding: 4px 10px;`

示例代码
```html
<input id="search-input" class="search-input" type="text" placeholder="搜索车票、餐饮、常旅客、相关规章" />
```

## 查询条件面板（QueryForm）
- 出发站 `#fromStationText`
  - 类型：`input[type=text]`
  - name：`leftTicketDTO.from_station_name`
  - 文本：空（动态输入）
  - 位置：`x=189.3, y=152.7, w=119.3, h=29.3`
  - 样式：`font-size: 12px; color: #999999; background-color: #FFFFFF; border: 1px solid #CFCDC7; padding: 5px 0 5px 5px;`
- 到达站 `#toStationText`
  - 类型：`input[type=text]`
  - name：`leftTicketDTO.to_station_name`
  - 位置：`x=420.3, y=152.7, w=119.3, h=29.3`
  - 样式：同上
- 出发日期 `#train_date`
  - 类型：`input[type=text]`
  - name：`leftTicketDTO.train_date`
  - 交互：集成 `WdatePicker`
  - 样式：`font-size: 12px; background-color: #FFFFFF; border: 1px solid #CFCDC7;`
- 查询按钮 `#query_ticket`
  - 类型：`a.btn92s`
  - 文本：`查询`
  - 位置：`x=1078.3, y=149.7, w=92, h=30`
  - 背景：`url(assets/kyfw_12306_ticketselection/images/bg_btn.png)`
  - 文本色：`#FFFFFF`

示例代码
```html
<div class="query-box">
  <input id="fromStationText" name="leftTicketDTO.from_station_name" type="text" class="inp-txt" />
  <input id="toStationText" name="leftTicketDTO.to_station_name" type="text" class="inp-txt" />
  <input id="train_date" name="leftTicketDTO.train_date" type="text" class="inp_selected" />
  <a id="query_ticket" class="btn92s" href="javascript:">查询</a>
</div>
```

## 筛选面板（FilterPanel）
- 车次类型（checkbox，name=`cc_type`）
  - `GC-高铁/城际`、`D-动车`、`Z-直达`、`T-特快`、`K-快速`、`其他`、`复兴号`、`智能动车组`
  - 每项尺寸：`13x13`，示例位置：`x≈160~825, y=251`
  - 样式：`margin-right: 4px`
- 显示选项（checkbox）
  - `#avail_zk` 显示折扣车次（`x=880.9, y=348.3, 13x13`）
  - `#avail_jf` 显示积分兑换车次（`x=977.4, y=348.3, 13x13`）
  - `#avail_ticket` 显示全部可预订车次（`x=1097.9, y=348.3, 13x13`）

示例代码
```html
<div class="filter-panel">
  <label><input type="checkbox" name="cc_type" class="check" /> GC-高铁/城际</label>
  <label><input type="checkbox" name="cc_type" class="check" /> D-动车</label>
  <label><input type="checkbox" name="cc_type" class="check" /> Z-直达</label>
  <label><input type="checkbox" name="cc_type" class="check" /> T-特快</label>
  <label><input type="checkbox" name="cc_type" class="check" /> K-快速</label>
  <label><input type="checkbox" name="cc_type" class="check" /> 其他</label>
  <label><input type="checkbox" name="cc_type" class="check" /> 复兴号</label>
  <label><input type="checkbox" name="cc_type" class="check" /> 智能动车组</label>
  <label><input id="avail_zk" type="checkbox" class="check" /> 显示折扣车次</label>
  <label><input id="avail_jf" type="checkbox" class="check" /> 显示积分兑换车次</label>
  <label><input id="avail_ticket" type="checkbox" class="check" /> 显示全部可预订车次</label>
</div>
```

## 查询结果表格（ResultsTable）
- 位置与尺寸：`x=37.3, y=372, width=1188.7, height=52`
- 表头列：
  - 车次
  - 出发站 / 到达站
  - 出发时间 / 到达时间
  - 历时
  - 商务座 / 特等座
  - 优选 / 一等座
  - 一等座
  - 二等座 / 二等包座
  - 高级 / 软卧
  - 软卧/动卧 / 一等卧
  - 硬卧 / 二等卧
  - 软座
  - 硬座
  - 无座
  - 其他
  - 备注
- 样式：`font-size: 12px; color: #000000; border-collapse: separate`

示例代码
```html
<table class="result-table">
  <thead>
    <tr>
      <th>车次</th>
      <th>出发站<br/>到达站</th>
      <th>出发时间<br/>到达时间</th>
      <th>历时</th>
      <th>商务座<br/>特等座</th>
      <th>优选<br/>一等座</th>
      <th>一等座</th>
      <th>二等座<br/>二等包座</th>
      <th>高级<br/>软卧</th>
      <th>软卧/动卧<br/>一等卧</th>
      <th>硬卧<br/>二等卧</th>
      <th>软座</th>
      <th>硬座</th>
      <th>无座</th>
      <th>其他</th>
      <th>备注</th>
    </tr>
  </thead>
  <tbody>
    <!-- 行数据由脚本渲染 -->
  </tbody>
</table>
```

## 导航菜单（Nav）
- 主要导航项（示例）
  - 首页、车票、团购服务、会员服务、站车服务、商旅服务、出行指南、信息查询
- 样式（示例）：`height: 40px; font-size: 14px; color: #FFFFFF; background-color: #184F87`

## 图片与背景资产映射
- 统一将背景图指向本地资源：示例
  - `background-image: url(assets/kyfw_12306_ticketselection/images/bg_btn.png);`
  - `background-image: url(assets/kyfw_12306_ticketselection/images/bg.png);`

## 无障碍与适老化文案（示例）
- 顶部搜索框 aria-label：`请输入要搜索的车票/餐饮/常旅客/相关规章`
- 跳转到结果区域链接：`跳转到车票查询结果区域`

## 结构化元素清单（摘要）
- 按钮：`#query_ticket`（a.btn92s，背景按钮图）
- 输入框：`#fromStationText`、`#toStationText`、`#train_date`、`#search-input`
- 下拉菜单：日期控件皮肤（`WdatePicker`）
- 链接：导航项、`查询更多中转方案`（`/otn/lcQuery/init`）
- 图片：logo 与页脚图标（本地化路径见资源清单）
- 复选框：车次类型与显示选项（详见筛选面板）
- 标签：列表与表头中各列名
- 表格：查询结果表（表头 16 列）
- 列表：导航菜单项（ul/li）
- 导航菜单：`nav` 与 `.nav-hd` 区域

## 组件 JSON（用于 1:1 样式映射）
```json
{
  "componentName": "QueryForm",
  "structure": {
    "type": "div",
    "children": [
      {"type": "input", "attrs": {"id": "fromStationText", "name": "leftTicketDTO.from_station_name", "class": "inp-txt", "type": "text"}},
      {"type": "input", "attrs": {"id": "toStationText", "name": "leftTicketDTO.to_station_name", "class": "inp-txt", "type": "text"}},
      {"type": "input", "attrs": {"id": "train_date", "name": "leftTicketDTO.train_date", "class": "inp_selected", "type": "text"}},
      {"type": "a", "attrs": {"id": "query_ticket", "class": "btn92s", "href": "javascript:"}, "text": "查询"}
    ]
  },
  "styles": {
    "gap": "8px"
  },
  "inputStyles": {
    "fontSize": "12px",
    "color": "#999999",
    "backgroundColor": "#FFFFFF",
    "border": "1px solid #CFCDC7",
    "padding": "5px 0 5px 5px"
  },
  "buttonStyles": {
    "height": "30px",
    "width": "92px",
    "color": "#FFFFFF",
    "backgroundImage": "url(assets/kyfw_12306_ticketselection/images/bg_btn.png)"
  }
}
```

```json
{
  "componentName": "FilterPanel",
  "structure": {
    "type": "div",
    "children": [
      {"type": "CheckboxGroup", "text": "车次类型"},
      {"type": "Checkbox", "text": "显示折扣车次"},
      {"type": "Checkbox", "text": "显示积分兑换车次"},
      {"type": "Checkbox", "text": "显示全部可预订车次"}
    ]
  },
  "styles": {
    "fontSize": "12px",
    "color": "#666666"
  }
}
```

```json
{
  "componentName": "ResultsTable",
  "structure": {
    "type": "table",
    "children": [
      {"type": "thead"},
      {"type": "tbody"}
    ]
  },
  "styles": {
    "fontSize": "12px",
    "color": "#000000",
    "borderCollapse": "separate"
  }
}
```

## 说明
- 所有样式值均由页面计算样式直接映射，确保数值一致。
- 静态资源均已下载至本地 `assets/kyfw_12306_ticketselection/`，引用路径相对且可离线加载。
