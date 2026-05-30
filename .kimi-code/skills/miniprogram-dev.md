# Skill: 微信小程序开发规范

## 概述

本项目是微信小程序项目，使用原生小程序框架开发。提供 WXML/WXSS/JS 编写规范、组件封装、API 调用等指导。

## 技术栈

- 原生微信小程序（无框架）
- appid: `wxc29e2adc86e681d6`
- 项目名称：划算小厨

## 目录结构

```
miniprogram/
├── app.js              # 全局逻辑
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── pages/              # 页面目录
│   └── 页面名/
│       ├── 页面名.js
│       ├── 页面名.json
│       ├── 页面名.wxml
│       └── 页面名.wxss
├── components/         # 自定义组件
│   └── 组件名/
│       ├── 组件名.js
│       ├── 组件名.json
│       ├── 组件名.wxml
│       └── 组件名.wxss
├── utils/              # 工具函数
├── cloud/              # 云开发相关
├── icons/              # 图标资源
└── images/             # 图片资源
```

## 编码规范

### WXML

- 使用双引号包裹属性值
- 事件绑定用 `bind:事件名` 而非 `bind事件名`
- 列表渲染必须加 `wx:key`
- 条件渲染优先用 `wx:if`，频繁切换用 `hidden`

```xml
<!-- 正确 -->
<view wx:for="{{list}}" wx:key="id">
  <text>{{item.name}}</text>
</view>

<button bind:tap="onSubmit">提交</button>
```

### WXSS

- 使用 rpx 作为尺寸单位
- 颜色值使用小写十六进制，优先用变量
- 避免使用 ID 选择器
- 公共样式提取到 app.wxss 或组件内

```css
/* 正确 */
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
}
```

### JS

- 使用 ES6+ 语法
- Page/Component 定义使用标准结构
- 数据操作必须通过 `this.setData`
- 异步操作使用 `async/await`
- API 调用统一封装到 utils/

```javascript
// Page 标准结构
Page({
  data: {
    list: [],
    loading: false,
  },

  async onLoad(options) {
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res = await wx.request({ url: '...' });
      this.setData({ list: res.data });
    } finally {
      this.setData({ loading: false });
    }
  },

  onTapItem(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
});
```

## 自定义组件规范

```javascript
// components/my-component/my-component.js
Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
  },
  data: {
    // 内部数据
  },
  methods: {
    onTap() {
      this.triggerEvent('click', { detail: 'data' });
    },
  },
});
```

## 常用 API 速查

| 功能 | API |
|---|---|
| 网络请求 | `wx.request` |
| 页面跳转 | `wx.navigateTo`, `wx.redirectTo`, `wx.switchTab` |
| 数据存储 | `wx.setStorageSync`, `wx.getStorageSync` |
| 获取用户信息 | `wx.getUserProfile` |
| 选择图片 | `wx.chooseImage` |
| 扫码 | `wx.scanCode` |
| 显示提示 | `wx.showToast`, `wx.showModal`, `wx.showLoading` |

## 云开发

云函数放在 `miniprogram/cloud/functions/` 下，使用 `wx.cloud.callFunction` 调用。
