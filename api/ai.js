// api/ai.js
export default async function handler(req, res) {
  // فقط اجازه درخواست POST می‌دهیم
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const apiKey = "om-2RPXvGmPydqP85rxiSsJRcmWogdxq41xhAxvTcYrr4T"; // کلید تو

  try {
    const response = await fetch("https://api.openmodel.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: "تو یک دستیار هوشمند برای اپلیکیشن پلنر هستی. پاسخ‌های کوتاه و انگیزشی به زبان فارسی بده." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
