// api/ai.js

module.exports = async (req, res) => {
  // فقط درخواست POST را قبول می‌کنیم
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  // کلید را از گاوصندوق ورسل می‌خواند (بدون اینکه در کد لو برود)
  const apiKey = process.env.OPENMODEL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is missing in Vercel' });
  }

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
          { 
            role: "system", 
            content: "تو یک دستیار صمیمی، دانا و خلاصه‌گو برای یک تقویم برنامه‌ریزی هستی. جواب‌ها را در یک یا دو خط و به زبان فارسی بده." 
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
