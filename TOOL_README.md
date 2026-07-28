# IELTS Phrase Card Tool | IELTS 短语卡工具

## 中文

### 这是什么

这是一个离线优先的 IELTS 短语卡工具，用于把书中的短语练成可在写作和口语中主动使用的表达。它不需要账号或网络服务；卡片默认保存在当前浏览器中。

### 打开工具

1. 双击打开 `短语卡工具.html`。
2. 使用浏览器打开页面。
3. 第一次使用时，页面会显示 0 张卡片；之后保存的内容会自动保留在同一浏览器中。

### 新建一张卡片

每张卡填写五项内容：

| 字段 | 怎么填写 |
| --- | --- |
| 英文短语 | 例如 `put theory into practice`。 |
| 个人化提示 | 写能让你想起使用场景的提示，例如 `Education: internship`。 |
| 英文释义 | 用简短英语解释意思，不抄很长的中文翻译。 |
| 固定搭配或语法框架 | 例如 `put + noun + into practice`。 |
| 我的原创句子 | 写自己的 IELTS 句子，不照抄书中例句。 |

然后选择：

- `W`：主要用于写作。
- `S`：主要用于口语。
- `WS`：写作和口语都可使用。

新卡建议先标为 `Y`。只有你能不看提示、自己造出语法和搭配都正确的句子时，再标为 `G`。

### 每日复习

点击“复习今日到期卡”。系统只会显示今天到期或已经逾期的卡片，并按 `R → Y → G` 排序。

先看正面，尝试说出英文释义、固定搭配和自己的例句；再点击“翻到背面”核对。根据实际回忆效果评分：

| 评分 | 含义 | 下一次复习 |
| --- | --- | --- |
| `G` | 能自主造句，语法和搭配正确。 | 进入下一间隔：D1、D3、D7、D14、D30、D60。 |
| `Y` | 理解，但仍需要提示。 | 次日再复习，不升级。 |
| `R` | 想不出、搭配错误或用法不自然。 | 次日复习，重置短间隔，并优先出现。 |

不要因为“希望它是 G”就给 G。`R` 卡不是失败，而是系统需要优先帮助你巩固的内容。

### 推荐日常流程

适合每天 40 分钟：

1. 10 分钟：完成所有今日到期卡。
2. 20 分钟：从当天学习单元录入 8-12 张新卡。
3. 10 分钟：挑 2-3 条新卡，写两句 IELTS 句子或录 45-60 秒口语。

### 搜索、编辑与删除

- 用搜索框查找短语、提示、搭配或自己的例句。
- 使用用途和状态筛选，快速找到写作卡、口语卡或 R 卡。
- 点击“编辑”修改卡片；修改后保留原有复习阶段和下次复习日期。
- 删除卡片无法恢复，建议删除前先导出备份。

### 备份与换电脑

卡片保存在浏览器本地，不会自动同步到另一台电脑、另一个浏览器或无痕窗口。

1. 定期点击“导出全部卡片（JSON）”。
2. 保存导出的 JSON 文件。
3. 在新电脑或新浏览器打开工具。
4. 点击“导入备份（JSON）”，选择 JSON 文件。

JSON 会保留短语内容、标签、G/Y/R 状态、复习阶段、下次复习日期和错卡次数。建议每周至少导出一次，也应在清理浏览器数据前导出。

### GitHub Pages 上线后

GitHub Pages 只托管工具代码，不会保存你的卡片。首次打开上线的网站时，需要导入之前导出的 JSON 备份。此后，卡片会保存在该网站所在浏览器的本地存储中。

## English

### What This Tool Does

This is an offline-first IELTS phrase-card tool. It helps you turn phrases from your study materials into expressions that you can actively use in writing and speaking. It requires no account or online service; cards are saved in the current browser by default.

### Open the Tool

1. Open `短语卡工具.html` in a browser.
2. The first visit starts with zero cards.
3. Cards saved afterwards remain available in the same browser.

### Create a Card

Complete these five fields for every card:

| Field | What to add |
| --- | --- |
| English phrase | For example, `put theory into practice`. |
| Personal prompt | A cue for a likely context, such as `Education: internship`. |
| English definition | A short English explanation, not a long translation. |
| Collocation or grammar pattern | For example, `put + noun + into practice`. |
| My original sentence | Your own IELTS sentence, not a copied example. |

Then select a tag:

- `W`: mainly for writing.
- `S`: mainly for speaking.
- `WS`: suitable for both writing and speaking.

Start new cards as `Y`. Change a card to `G` only when you can produce a grammatically correct sentence with the right collocation without a prompt.

### Daily Review

Select “Review today's due cards”. The tool shows only cards due today or overdue, ordered as `R → Y → G`.

Look at the front first and try to recall the English definition, collocation, and your original sentence. Reveal the back to check, then grade the card honestly:

| Grade | Meaning | Next review |
| --- | --- | --- |
| `G` | You can create a correct sentence independently. | Move to the next interval: D1, D3, D7, D14, D30, and D60. |
| `Y` | You understand it but still need a prompt. | Review it again tomorrow without advancing the interval. |
| `R` | You forgot it, used an incorrect collocation, or used it unnaturally. | Review it tomorrow, reset it to a short interval, and prioritise it. |

An `R` card is not a failure. It tells the system what needs more attention.

### Suggested Daily Routine

For a 40-minute session:

1. Spend 10 minutes completing all cards due today.
2. Spend 20 minutes adding 8-12 useful expressions from the current study unit.
3. Spend 10 minutes using 2-3 new cards in two IELTS sentences or a 45-60 second spoken answer.

### Search, Edit, and Delete

- Search by phrase, prompt, collocation, or your original sentence.
- Filter by tag or status to find writing cards, speaking cards, or R cards quickly.
- Use “Edit” to change a card. Its review stage and next due date are retained.
- Deleted cards cannot be restored, so export a backup before deleting cards you may need later.

### Backup and Move to Another Computer

Cards are stored in the browser. They do not automatically sync to another computer, browser, or private window.

1. Select “Export all cards (JSON)” regularly.
2. Keep the downloaded JSON file.
3. Open the tool on the new computer or browser.
4. Select “Import backup (JSON)” and choose that file.

The JSON backup preserves phrase content, tags, G/Y/R grades, review stages, next review dates, and lapse counts. Export at least once a week and always before clearing browser data.

### After Publishing with GitHub Pages

GitHub Pages hosts the tool code only. It does not store your cards. When you first open the published site, import an existing JSON backup. Afterwards, cards are stored in that website's browser local storage.
