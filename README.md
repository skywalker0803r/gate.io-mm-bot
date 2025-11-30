# Gate.io Market Making Bot 📈

一個專業的 Gate.io 高頻做市交易機器人 Web 應用程式，支援網格策略和 Avellaneda 學術模型。

<div align="center">

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

</div>

## 🚀 功能特色

### 📊 交易策略
- **網格策略 (Grid Strategy)**: 在價格範圍內建立買賣網格，自動化套利
- **Avellaneda 策略**: 基於學術研究的高頻做市模型，動態調整買賣價格

### 🎯 核心功能
- **即時價格監控**: 實時追蹤市場價格變化
- **智能倉位管理**: 自動平衡多空倉位和庫存
- **風險控制**: 可配置的槓桿、倉位閾值和止損機制
- **模擬交易**: Paper Trading 模式，無風險測試策略
- **專業圖表**: 實時價格圖表和技術指標
- **詳細日誌**: 完整的交易記錄和系統狀態

### 🛡️ 安全特性
- API 金鑰加密存儲
- 模擬模式優先
- 倉位限制保護
- 實時風險監控

## 🔧 技術架構

- **前端框架**: React 19 + TypeScript
- **構建工具**: Vite
- **圖表庫**: Recharts
- **加密**: crypto-js
- **UI 組件**: Lucide React
- **樣式**: Tailwind CSS

## 📋 前置要求

- **Node.js** (版本 16 或更高)
- **Gate.io 交易所帳戶**
- **API 金鑰** (具備期貨交易權限)

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```

### 3. 設定交易參數
1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 在配置表單中輸入 Gate.io API 金鑰
3. 選擇交易策略和風險參數
4. **建議首次使用時啟用「模擬模式」**

### 4. 開始交易
1. 檢查所有配置參數
2. 點擊「啟動策略」按鈕
3. 監控即時圖表和日誌輸出

## ⚙️ 配置參數

### 基本設定
| 參數 | 說明 | 預設值 |
|------|------|---------|
| API Key | Gate.io API 金鑰 | - |
| API Secret | Gate.io API 密鑰 | - |
| 交易對 | 交易幣種 | BTC |
| 槓桿 | 交易槓桿倍數 | 1x |
| 初始數量 | 單次交易數量 | 0.01 |

### 風險管理
| 參數 | 說明 | 預設值 |
|------|------|---------|
| 倉位閾值 | 最大允許倉位 | 500 |
| 模擬模式 | 是否為模擬交易 | true |

### 網格策略參數
| 參數 | 說明 | 預設值 |
|------|------|---------|
| 網格間距 | 買賣單之間的價格間距 | 0.6% |
| 止盈間距 | 獲利了結的價格間距 | 0.4% |

### Avellaneda 策略參數
| 參數 | 說明 | 預設值 |
|------|------|---------|
| Gamma (γ) | 風險厭惡參數 | 1.0 |
| Eta (η) | 庫存風險參數 | 自動 |
| Sigma (σ) | 波動率參數 | 自動 |
| 時間範圍 | 策略運行時間窗口 | 1 小時 |

## ⚠️ 風險警告

**這是一個高風險的量化交易工具，使用前請務必了解以下風險：**

1. **市場風險**: 加密貨幣市場波動劇烈，可能造成重大損失
2. **技術風險**: 網路延遲、API 故障可能影響交易執行
3. **策略風險**: 做市策略在極端市場條件下可能失效
4. **資金管理**: 請僅使用您可以承受損失的資金

**強烈建議：**
- 首次使用請啟用「模擬模式」
- 充分理解 Avellaneda 模型和網格策略原理
- 設定合理的倉位限制和止損點
- 持續監控策略表現

## 🏗️ 專案結構

```
├── components/          # React 組件
│   ├── ConfigForm.tsx   # 策略配置表單
│   ├── LogConsole.tsx   # 日誌控制台
│   └── RealtimeChart.tsx # 即時圖表
├── hooks/
│   └── useTradingBot.ts # 核心交易邏輯 Hook
├── types.ts             # TypeScript 類型定義
├── App.tsx             # 主應用程式組件
└── index.tsx           # 應用程式入口點
```

## 🛠️ 可用指令

```bash
# 開發模式
npm run dev

# 構建生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 📚 相關文獻

- [Avellaneda & Stoikov - High-frequency trading in a limit order book](https://web.stanford.edu/class/msande448/2018/Final/Reports/gr5.pdf)
- [Grid Trading Strategy](https://www.investopedia.com/articles/trading/06/grid.asp)
- [Gate.io API Documentation](https://www.gate.io/docs/developers/apiv4/)

## 📄 授權

此專案僅供教育和研究用途。請遵守當地法規和交易所規則。

---

**免責聲明**: 本軟體僅供教育用途，開發者不對任何交易損失承擔責任。請在充分了解風險的情況下使用。
