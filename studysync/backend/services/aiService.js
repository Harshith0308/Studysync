const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

function getProviderConfig() {
  const provider = DEFAULT_PROVIDER.toLowerCase();

  if (provider === 'gemini') {
    return {
      provider,
      apiKey: process.env.GEMINI_API_KEY,
      model: GEMINI_MODEL,
      baseUrl: GEMINI_BASE_URL,
    };
  }

  return {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: OPENAI_MODEL,
    baseUrl: OPENAI_BASE_URL,
  };
}

function getProviderDisplayName(provider) {
  return provider === 'gemini' ? 'Gemini' : 'OpenAI';
}

function buildProviderErrorMessage(provider, status, data) {
  const directMessage = data?.error?.message || data?.message;
  if (directMessage) {
    return directMessage;
  }

  if (provider === 'gemini' && status === 429) {
    return 'Gemini request failed because the API key has reached its quota or rate limit. Check your Gemini/Google AI billing, usage limits, and API key permissions.';
  }

  if (provider === 'openai' && status === 429) {
    return 'OpenAI request failed because the API key has reached its quota or rate limit. Check your OpenAI billing and usage limits.';
  }

  return `${getProviderDisplayName(provider)} request failed with status ${status}`;
}

function buildFallbackAnswer({ question, context }) {
  const tasks = (context?.tasks || []).slice(0, 8);
  const notes = (context?.notes || []).slice(0, 8);
  const group = context?.group;
  const { provider } = getProviderConfig();

  const taskLines = tasks
    .map((t) => {
      const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline';
      return `- ${t.title} (${t.status || 'pending'}), deadline: ${deadline}`;
    })
    .join('\n');

  const noteLines = notes.map((n) => `- ${n.title}`).join('\n');

  return [
    `AI assistant is not configured on this server (missing ${provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}).`,
    '',
    `Your question: ${question}`,
    '',
    group ? `Group: ${group.title} (${group.subject || 'N/A'})` : '',
    taskLines ? `\nRelevant tasks:\n${taskLines}` : '',
    noteLines ? `\nRelevant notes:\n${noteLines}` : '',
    '',
    provider === 'gemini'
      ? 'If you want full AI answers, set GEMINI_API_KEY (and optionally GEMINI_MODEL, GEMINI_BASE_URL) in backend/.env and restart the backend.'
      : 'If you want full AI answers, set OPENAI_API_KEY (and optionally OPENAI_MODEL, OPENAI_BASE_URL) in backend/.env and restart the backend.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function askGemini({ question, context }) {
  const { provider, apiKey, model, baseUrl } = getProviderConfig();
  if (!apiKey) {
    return buildFallbackAnswer({ question, context });
  }

  const systemPrompt =
    'You are StudySync AI Assistant. Help students understand concepts, solve doubts, and plan study tasks. ' +
    'Be concise, correct, and step-by-step when needed. If information is missing, ask a clarifying question. ' +
    'Use the provided group context (notes/tasks/chat snippets) to ground your answer.';

  const userPrompt = [
    'Context (JSON):',
    JSON.stringify(context || {}, null, 2),
    '',
    'Student question:',
    question,
  ].join('\n');

  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
  
  const data = {
    contents: [
      {
        parts: [
          { text: systemPrompt + '\n\n' + userPrompt },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = buildProviderErrorMessage(provider, res.status, responseData);
    throw new Error(msg);
  }

  const content = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('AI response was empty');
  }

  return content;
}

async function askOpenAI({ question, context }) {
  const { provider, apiKey, model, baseUrl } = getProviderConfig();
  if (!apiKey) {
    return buildFallbackAnswer({ question, context });
  }

  const systemPrompt =
    'You are StudySync AI Assistant. Help students understand concepts, solve doubts, and plan study tasks. ' +
    'Be concise, correct, and step-by-step when needed. If information is missing, ask a clarifying question. ' +
    'Use the provided group context (notes/tasks/chat snippets) to ground your answer.';

  const userPrompt = [
    'Context (JSON):',
    JSON.stringify(context || {}, null, 2),
    '',
    'Student question:',
    question,
  ].join('\n');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = buildProviderErrorMessage(provider, res.status, data);
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI response was empty');
  }

  return content;
}

async function askAI({ question, context }) {
  const { provider } = getProviderConfig();
  if (provider === 'gemini') {
    return askGemini({ question, context });
  }
  return askOpenAI({ question, context });
}

module.exports = { askAI };
