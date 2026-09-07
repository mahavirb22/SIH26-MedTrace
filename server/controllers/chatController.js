import env from '../config/env.js';

/**
 * POST /api/chat/medication
 * Proxies medication questions to Gemini API with drug context as grounding.
 */
export async function chatMedication(req, res, next) {
  try {
    const { question, drugContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    // If no Gemini API key, fall back to rule-based responses
    if (!env.GEMINI_API_KEY) {
      const response = getFallbackResponse(question, drugContext);
      return res.json({ response, source: 'fallback' });
    }

    // Build grounded prompt for Gemini
    const systemPrompt = buildSystemPrompt(drugContext);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nPatient question: ${question}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiResponse.status);
      const response = getFallbackResponse(question, drugContext);
      return res.json({ response, source: 'fallback' });
    }

    const data = await geminiResponse.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      getFallbackResponse(question, drugContext);

    res.json({ response: text, source: 'gemini' });
  } catch (err) {
    next(err);
  }
}

function buildSystemPrompt(drugContext) {
  const ctx = drugContext || {};
  return `You are MedTrace AI Medication Assistant. You provide helpful, accurate, and concise medical information about medications. You are NOT a doctor and always recommend consulting a healthcare professional.

Current medication context:
- Product: ${ctx.productName || 'Unknown'}
- Dosage Form: ${ctx.dosageForm || 'Unknown'}
- Strength: ${ctx.strength || 'Unknown'}
- Manufacturer: ${ctx.manufacturer || 'Unknown'}
- Batch ID: ${ctx.batchId || 'Unknown'}
- Expiry Date: ${ctx.expiryDate || 'Unknown'}

Respond in the same language the patient uses. Keep answers under 3 sentences. Include a disclaimer to consult a doctor for personalized advice.`;
}

function getFallbackResponse(question, drugContext) {
  const q = question.toLowerCase();
  const drug = drugContext?.productName || 'this medication';

  if (q.includes('side effect')) {
    return `Common side effects of ${drug} may include nausea, headache, and dizziness. If you experience severe symptoms, please consult your doctor immediately.`;
  }
  if (q.includes('food') || q.includes('meal')) {
    return `${drug} can generally be taken with or without food. Taking it with meals may help reduce stomach upset. Check with your pharmacist for specific guidance.`;
  }
  if (q.includes('alcohol')) {
    return `It is generally recommended to avoid alcohol while taking ${drug}, as it may increase the risk of side effects. Please consult your doctor for personalized advice.`;
  }
  if (q.includes('dosage') || q.includes('dose') || q.includes('how much')) {
    return `Please follow the dosage instructions provided by your prescribing doctor. Do not alter your dosage without medical consultation.`;
  }
  if (q.includes('pregnancy') || q.includes('pregnant')) {
    return `If you are pregnant or planning pregnancy, please consult your doctor before taking ${drug}. Some medications may not be safe during pregnancy.`;
  }
  return `I can help answer questions about ${drug} regarding dosage, side effects, food interactions, and more. For personalized medical advice, please consult your healthcare provider.`;
}
