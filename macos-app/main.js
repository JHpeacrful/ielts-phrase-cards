const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

let mainWindow;

function settingsPath() {
  return path.join(app.getPath('userData'), 'ai-settings.json');
}

function profileId() {
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanProfile(profile, fallback = {}) {
  return {
    id: String(profile?.id || fallback.id || profileId()),
    name: String(profile?.name || fallback.name || '默认配置').trim() || '默认配置',
    endpoint: String(profile?.endpoint || '').trim(),
    model: String(profile?.model || '').trim(),
    apiKey: String(profile?.apiKey || fallback.apiKey || '').trim()
  };
}

async function readSettings() {
  try {
    const value = JSON.parse(await fs.readFile(settingsPath(), 'utf8'));
    if (Array.isArray(value?.profiles)) {
      const profiles = value.profiles.map(profile => cleanProfile(profile));
      return { version: 2, activeProfileId: value.activeProfileId || profiles[0]?.id || '', profiles };
    }
    if (value?.endpoint || value?.model || value?.apiKey) {
      const profile = cleanProfile(value, { name: '默认配置' });
      return { version: 2, activeProfileId: profile.id, profiles: [profile] };
    }
  } catch (_) { /* first run or an unreadable old file */ }
  return { version: 2, activeProfileId: '', profiles: [] };
}

function publicProfile(profile) {
  return { id: profile.id, name: profile.name, endpoint: profile.endpoint, model: profile.model, hasApiKey: Boolean(profile.apiKey) };
}

function publicSettings(settings) {
  return { activeProfileId: settings.activeProfileId, profiles: settings.profiles.map(publicProfile) };
}

async function writeSettings(settings) {
  const existing = await readSettings();
  const incoming = Array.isArray(settings?.profiles) ? settings.profiles : [];
  const existingById = new Map(existing.profiles.map(profile => [profile.id, profile]));
  const profiles = incoming.map(profile => cleanProfile(profile, existingById.get(profile?.id)));
  const activeProfileId = profiles.some(profile => profile.id === settings?.activeProfileId)
    ? settings.activeProfileId
    : profiles[0]?.id || '';
  const next = { version: 2, activeProfileId, profiles };
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
  return publicSettings(next);
}

function completionsUrl(endpoint) {
  const value = String(endpoint || '').trim().replace(/\/+$/, '');
  if (!value) throw new Error('请先填写 API 地址。');
  const parsed = new URL(value);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('API 地址必须以 http:// 或 https:// 开头。');
  return value.endsWith('/chat/completions') ? value : `${value}/chat/completions`;
}

function modelsUrl(endpoint) {
  const value = String(endpoint || '').trim().replace(/\/+$/, '');
  if (!value) throw new Error('请先填写 API 地址。');
  const parsed = new URL(value);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('API 地址必须以 http:// 或 https:// 开头。');
  const base = value.endsWith('/chat/completions') ? value.slice(0, -'/chat/completions'.length) : value;
  return `${base}/models`;
}

function errorForResponse(response, raw) {
  const detail = String(raw || '').replace(/\s+/g, ' ').slice(0, 260);
  return `API 返回 HTTP ${response.status}${detail ? `：${detail}` : ''}`;
}

async function callModel(settings, messages, options = {}) {
  if (!settings?.endpoint || !settings?.model || !settings?.apiKey) throw new Error('请先在 AI 设置中填写完整的 API 地址、模型和 API Key。');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 45000);
  try {
    const response = await fetch(completionsUrl(settings.endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({ model: settings.model, temperature: options.temperature ?? 0.35, max_tokens: options.maxTokens ?? 500, messages }),
      signal: controller.signal
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(errorForResponse(response, raw));
    let payload;
    try { payload = JSON.parse(raw); } catch (_) { throw new Error('API 返回的不是 JSON，请确认填写的是 OpenAI 兼容接口。'); }
    return payload.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('请求超时，请检查网络或换一个模型后重试。');
    throw error;
  } finally { clearTimeout(timeout); }
}

async function fetchModels(settings) {
  if (!settings?.endpoint || !settings?.apiKey) throw new Error('请先填写 API 地址和 API Key。');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(modelsUrl(settings.endpoint), {
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      signal: controller.signal
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(errorForResponse(response, raw));
    let payload;
    try { payload = JSON.parse(raw); } catch (_) { throw new Error('模型接口返回的不是 JSON。'); }
    const models = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(models)) throw new Error('模型接口未返回可识别的模型列表。');
    return [...new Set(models.map(model => typeof model === 'string' ? model : model?.id).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('获取模型超时，请检查网络后重试。');
    throw error;
  } finally { clearTimeout(timeout); }
}

const fieldLabels = { prompt: '个人化提示', definition: '英文释义', pattern: '固定搭配或语法框架', sentence: '我的原创句子' };

const fieldRules = {
  prompt: '生成一个有助于理解、记住或正确应用目标短语的个人化记忆提示。提示可以是中文或英文，请自行选择对记忆更有效的语言；优先使用具体的联想、使用场景、语义对比、词义拆解或常见语境，而不是泛泛的主题标签。只返回一条简洁提示，不要重复短语本身，不要完整例句、解释、编号或 Markdown。',
  definition: '只返回简洁准确的英文释义，不要例句、中文、词源说明或 Markdown。',
  pattern: '只返回固定搭配或语法框架本身。使用 + noun、+ someone、[主语] 等槽位表达结构；严禁返回任何完整例句、句号结尾的句子、中文解释、编号或 Markdown。',
  sentence: '必须返回恰好两行：第一行以“口语：”开头，第二行以“书面：”开头。两行都要自然、准确、符合 IELTS 7-8 分段表达，且都要正确使用目标短语；口语句自然清晰，书面句适合 Task 2 正式语境。不要添加第三行、解释、编号或 Markdown。'
};

function fieldSystemPrompt(field, mode) {
  const label = fieldLabels[field] || '文本';
  const style = {
    generate: '根据短语和上下文生成新的内容',
    rewrite: '保留原意，改写这段内容',
    regenerate: '重新生成一版不同的内容',
    shorten: '把内容压缩得更简洁',
    expand: '在不编造事实的前提下，把内容展开得更完整',
    ielts: '改成自然、准确、适合 IELTS 的表达'
  }[mode] || '生成新的内容';
  return `你是 IELTS 英语学习编辑。目标字段是“${label}”，请${style}。${fieldRules[field] || '只返回纯文本，不要 Markdown、引号或解释。'} 保持英式拼写、语言自然、语法准确，不要为了复杂而堆砌生僻词。`;
}

function fieldUserPrompt(field, phrase, context, source) {
  const promptTask = field === 'prompt'
    ? '请把输出写成能让学习者迅速联想到该短语含义或实际使用方式的记忆/应用提示；如果中文更好记就用中文，如果英文更好记就用英文。不要只写一个学科、领域或主题名称。'
    : '';
  return `${promptTask}\n短语：${phrase || '（未填写）'}\n个人化提示：${context || '（未填写）'}\n当前内容：${source || '（空白，请直接生成）'}`;
}

function validateFieldOutput(field, value) {
  const content = String(value || '').trim();
  if (!content) throw new Error('AI 没有返回内容，请重试。');
  if (field === 'pattern') {
    if (/(例句|example sentence|for example|e\.g\.)/i.test(content) || /[.!?。！？]/.test(content)) {
      throw new Error('AI 返回了疑似例句，未应用到固定搭配字段。请点击“再生成”。');
    }
  }
  if (field === 'sentence') {
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const oral = lines.find(line => /^口语\s*[:：]/.test(line));
    const written = lines.find(line => /^书面\s*[:：]/.test(line));
    if (!oral || !written || lines.length !== 2) {
      throw new Error('AI 返回格式不符合要求，需要恰好一行“口语：”和一行“书面：”。请点击“再生成”。');
    }
    return `${oral}\n${written}`;
  }
  return content;
}

app.whenReady().then(() => {
  ipcMain.handle('ai:settings-load', async () => publicSettings(await readSettings()));
  ipcMain.handle('ai:settings-save', async (_, settings) => writeSettings(settings));
  ipcMain.handle('ai:test', async (_, suppliedProfile) => {
    const settings = await readSettings();
    const stored = suppliedProfile?.id ? settings.profiles.find(item => item.id === suppliedProfile.id) : null;
    const profile = suppliedProfile?.endpoint
      ? cleanProfile({ ...stored, ...suppliedProfile }, stored || {})
      : stored || settings.profiles.find(item => item.id === settings.activeProfileId) || settings.profiles[0];
    const reply = await callModel(profile, [{ role: 'user', content: 'Reply with OK only.' }], { maxTokens: 8 });
    return { model: profile.model, reply: reply || 'OK' };
  });
  ipcMain.handle('ai:models', async (_, suppliedProfile) => {
    const settings = await readSettings();
    const stored = suppliedProfile?.id ? settings.profiles.find(item => item.id === suppliedProfile.id) : null;
    const profile = suppliedProfile?.endpoint
      ? cleanProfile({ ...stored, ...suppliedProfile }, stored || {})
      : stored || settings.profiles.find(item => item.id === settings.activeProfileId) || settings.profiles[0];
    return { models: await fetchModels(profile), profileId: profile.id };
  });
  ipcMain.handle('ai:generate-field', async (_, payload = {}) => {
    const settings = await readSettings();
    const profile = payload.profile?.endpoint ? cleanProfile(payload.profile) : settings.profiles.find(item => item.id === payload.profileId) || settings.profiles.find(item => item.id === settings.activeProfileId) || settings.profiles[0];
    const field = String(payload.field || '');
    if (!fieldLabels[field]) throw new Error('暂不支持这个字段。');
    const source = String(payload.source || '').trim();
    const phrase = String(payload.phrase || '').trim();
    const context = String(payload.context || '').trim();
    const rawContent = await callModel(profile, [
      { role: 'system', content: fieldSystemPrompt(field, payload.mode) },
      { role: 'user', content: fieldUserPrompt(field, phrase, context, source) }
    ]);
    const content = validateFieldOutput(field, rawContent);
    return { text: content, profileId: profile.id, model: profile.model };
  });
  ipcMain.handle('ai:import-text', async (_, payload = {}) => {
    const settings = await readSettings();
    const profile = settings.profiles.find(item => item.id === payload.profileId) || settings.profiles.find(item => item.id === settings.activeProfileId) || settings.profiles[0];
    const source = String(payload.source || '').trim();
    if (!source) throw new Error('请先粘贴需要整理的文字。');
    const content = await callModel(profile, [
      { role: 'system', content: '你是 IELTS 词库整理编辑。请从用户粘贴的混合文本中提取可能的英文短语卡，并自动补全缺失字段。只返回 JSON 数组，不要 Markdown。每个对象必须只有 phrase、prompt、definition、pattern、sentence、confidence、status 七个键，全部是字符串。phrase 是英文短语；prompt 是简短话题提示；definition 是简洁英文释义；pattern 只能是固定搭配或语法框架，禁止例句；sentence 只保留最终推荐的一句原创例句，通常优先口语，纯正式书面短语才用书面句，要求 IELTS 7-8 分段；confidence 只能是 high、medium 或 low；无法确认的行必须 status 为 pending，否则 status 为 ready。没有可靠英文短语的内容不要硬编。' },
      { role: 'user', content: source.slice(0, 24000) }
    ], { maxTokens: 3000, temperature: 0.2 });
    let rows;
    try { rows = JSON.parse(content.replace(/^```json\s*|```$/g, '').trim()); } catch (_) { throw new Error('AI 返回的词库格式无法识别，请重试。'); }
    if (!Array.isArray(rows)) throw new Error('AI 没有返回可识别的词库列表。');
    return { rows: rows.slice(0, 120).map(row => ({ phrase:String(row?.phrase || '').trim(), prompt:String(row?.prompt || '').trim(), definition:String(row?.definition || '').trim(), pattern:String(row?.pattern || '').trim(), sentence:String(row?.sentence || '').trim(), confidence:['high','medium','low'].includes(row?.confidence) ? row.confidence : 'medium', status:row?.status === 'pending' ? 'pending' : 'ready' })).filter(row => row.phrase) };
  });
  ipcMain.handle('ai:quote', async (_, payload = {}) => {
    const settings = await readSettings();
    const profile = settings.profiles.find(item => item.id === payload.profileId) || settings.profiles.find(item => item.id === settings.activeProfileId) || settings.profiles[0];
    const style = {calm:'冷静克制、具体、不煽情', warm:'温柔鼓励、真诚、不空泛', exam:'考试冲刺、聚焦准确输出和稳定发挥', brief:'简短有力、最多二十个汉字'}[payload.style] || '冷静克制';
    const text = await callModel(profile, [
      { role: 'system', content: `你是 IELTS 学习教练。请写一句中文学习提醒，风格为“${style}”。只返回一句话，不要引号、编号、换行、解释或标签。不要使用夸张鸡汤。` },
      { role: 'user', content: `日期：${String(payload.date || '')}` }
    ], {maxTokens:80, temperature:0.7});
    return {text:text.replace(/[\r\n]+/g, ' ').trim()};
  });
  ipcMain.handle('ai:complete-card', async (_, payload = {}) => {
    const settings = await readSettings();
    const profile = payload.profile?.endpoint ? cleanProfile(payload.profile) : settings.profiles.find(item => item.id === payload.profileId) || settings.profiles[0];
    const content = await callModel(profile, [
      { role: 'system', content: 'You create IELTS English phrase-card content. Return JSON only with exactly three string keys: definition, pattern, sentence. definition is a concise English meaning. pattern is only a collocation or grammar frame, never an example sentence. sentence must contain exactly two lines: one labelled 口语 and one labelled 书面, both natural, accurate IELTS band 7-8 examples using the phrase. No markdown or extra keys.' },
      { role: 'user', content: `Phrase: ${String(payload.phrase || '').trim()}\nContext hint: ${String(payload.prompt || '').trim()}` }
    ]);
    try { return JSON.parse(content.replace(/^```json\s*|```$/g, '').trim()); }
    catch (_) { throw new Error('AI 返回格式无法识别，请重试或换一个模型。'); }
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 900,
    minWidth: 900,
    minHeight: 680,
    title: 'IELTS 短语卡',
    backgroundColor: '#f4efe6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
