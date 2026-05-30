# Skill: 微信小程序测试

## 概述

提供微信小程序的测试策略和工具链，覆盖单元测试、组件测试和 E2E 测试。

## 测试工具链

| 类型 | 工具 | 用途 |
|---|---|---|
| 单元测试 | Jest + miniprogram-simulate | 测试 JS 逻辑、工具函数 |
| 组件测试 | miniprogram-simulate | 测试自定义组件渲染和交互 |
| E2E 测试 | 微信开发者工具自动化 | 端到端流程测试 |
| 代码规范 | ESLint + Prettier | 静态检查和格式化 |

## 单元测试示例

### 安装依赖

```bash
npm install --save-dev jest miniprogram-simulate
```

### 测试工具函数

```javascript
// utils/format.test.js
const { formatDate, formatPrice } = require('./format');

describe('format', () => {
  test('formatDate', () => {
    expect(formatDate('2024-01-01')).toBe('2024年01月01日');
  });

  test('formatPrice', () => {
    expect(formatPrice(1999)).toBe('¥19.99');
  });
});
```

### 测试自定义组件

```javascript
// components/my-component/my-component.test.js
const simulate = require('miniprogram-simulate');

 test('渲染正确', () => {
   const comp = simulate.render(simulate.load('components/my-component/my-component'));
   expect(comp.querySelector('.title').dom.innerHTML).toBe('标题');
 });
```

## package.json 配置

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint miniprogram/"
  }
}
```

## 测试目录规范

```
miniprogram/
├── utils/
│   ├── format.js
│   └── format.test.js      # 同目录测试文件
├── components/
│   └── my-component/
│       ├── my-component.js
│       └── my-component.test.js
└── __tests__/              # 集成测试
    └── e2e.test.js
```

## 微信小程序特有测试要点

1. **API Mock**：使用 `jest.mock` 模拟 `wx.*` API
2. **setData 测试**：检查组件数据变化
3. **生命周期测试**：验证 onLoad/onShow/onReady 行为
4. **事件测试**：模拟用户点击、输入等交互

## 示例：Mock wx API

```javascript
// __mocks__/wx.js
global.wx = {
  request: jest.fn(() => Promise.resolve({ data: {} })),
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  showToast: jest.fn(),
  navigateTo: jest.fn(),
};
```
