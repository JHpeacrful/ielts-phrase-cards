# IELTS Phrase Cards macOS App

这是 IELTS 短语卡网站的 macOS Electron 版本。它保留离线短语卡和复习流程，并增加可选的 OpenAI 兼容 API 助手。

App 图标使用项目旁的 `../icon-assets/ielts-phrase-icon-v2-01.png` 生成，主题为打开的短语卡与对话气泡。

## 开发运行

```bash
npm install
npm start
```

## 打包

```bash
npm run dist
```

构建产物位于 `dist/mac-arm64/IELTS Phrase Cards.app`，目标为 Apple Silicon macOS。

## API 设置

App 使用顶部五标签导航切换“概览、学习、复习、历史、设置”。概览显示今日到期数量、复习进度和连续学习天数；学习页保留填写中的草稿，历史页管理全部卡片，复习页只展示今日到期卡。

在“设置”页打开“AI 设置”，可以保存多条配置。每条配置填写：

- 配置名称
- API 地址，例如 `https://api.example.com/v1`
- 模型名称，例如 `gpt-4o-mini`
- API Key

接口需要兼容 OpenAI Chat Completions。填写地址和 Key 后点击“获取模型”，即可从服务商返回的模型列表中选择并填入模型名称，也仍可手动输入。点击“测试连接”确认成功后，在个人化提示、英文释义、搭配/框架或原创句子字段旁点击 `AI`。生成结果会先进入小型工作台预览，确认后点击“应用结果”才会写回；选中字段中的一段文字时，只替换选区。工作台内可以切换已保存的 API/模型，也可以重新生成、缩短、展开或改成 IELTS 表达。

“短语”字段由用户手动输入，不提供 AI 自动替换入口。

旧版本的单一 API 设置会在首次打开时自动迁移为“默认配置”。

API Key 只保存到当前 Mac 的 Electron 用户数据目录，不写入代码、仓库或短语卡 JSON 导出文件。

## 数据说明

网站版本仍然保留在原仓库中。当前 App 版沿用网站的短语卡 JSON 数据结构，后续可以加入从旧网站导出的 JSON 到 App 本地数据的专用迁移页。

## 签名说明

本地构建未使用 Developer ID 签名和公证。分发给其他 Mac 前，需要使用你自己的 Apple Developer 账号完成签名、公证和 DMG 打包。
