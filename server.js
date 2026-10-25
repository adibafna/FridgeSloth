const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'gemma3:4b';
const FALLBACK_MODEL = 'gemma2:2b';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    const hasGemma3 = models.some(m => m.includes('gemma3'));
    const hasGemma2 = models.some(m => m.includes('gemma2'));
    return {
      online: true,
      models,
      recommendedModel: hasGemma3 ? 'gemma3:4b' : (hasGemma2 ? 'gemma2:2b' : models[0] || 'none')
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

async function queryOllama({ model, prompt, system, images = [], stream = false }) {
  const body = {
    model,
    prompt,
    stream,
    options: {
      temperature: 0.2,
      num_predict: 1200
    }
  };

  if (system) body.system = system;
  if (images && images.length > 0) body.images = images;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return data.response;
}

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_) {}

  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (_) {}
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  throw new Error("Could not extract valid JSON from model response");
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers for local flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health API
  if (pathname === '/api/health' && req.method === 'GET') {
    const health = await checkOllamaHealth();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  // Analyze & Plan API
  if (pathname === '/api/analyze' && req.method === 'POST') {
    const startTime = Date.now();
    let rawBody = '';

    req.on('data', chunk => {
      rawBody += chunk;
      if (rawBody.length > 15 * 1024 * 1024) { // 15MB limit
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(rawBody);
        const { image, textIngredients, effortLevel = 'couch', diet = 'None' } = payload;

        let detectedItems = [];
        let modelToUse = DEFAULT_MODEL;

        // Verify model availability
        const health = await checkOllamaHealth();
        if (health.online && health.recommendedModel) {
          modelToUse = health.recommendedModel;
        }

        let ingredientsSummary = textIngredients || '';

        // Step 1: If an image is provided, run Gemma 3 Vision extraction
        if (image) {
          const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
          const visionPrompt = `You are FridgeSloth, a visual kitchen assistant. Look carefully at this photo of a refrigerator, pantry, or food shelf.
List all clearly visible food ingredients, drinks, condiments, leftovers, or produce.
Keep your response concise: list the ingredients separated by commas only. Do not hallucinate items that are not in the photo.`;

          try {
            const visionResponse = await queryOllama({
              model: modelToUse,
              prompt: visionPrompt,
              images: [cleanBase64]
            });
            ingredientsSummary = visionResponse.trim();
          } catch (visionErr) {
            console.warn('Vision extraction fallback:', visionErr.message);
            ingredientsSummary = ingredientsSummary || 'Assorted fridge staples (eggs, cheese, condiments, bread)';
          }
        }

        // Step 2: Recipe & Lazy Meal Generation
        const effortDescriptions = {
          couch: 'Total Couch Sloth — strictly 1 bowl or 1 mug, microwave or electric kettle only, 0 knives, zero chopping, under 4 minutes total.',
          skillet: 'One-Pan Skillet Sizzle — 1 pan, 1 spatula, minimal knife work, under 8 minutes, maximum crispy comfort.',
          simmer: 'Gentle Simmer — low effort, set on low heat and walk away to lie down, under 15 minutes.'
        };

        const systemPrompt = `You are FridgeSloth 🦥, the world's most delightfully lazy personal chef and grocery organizer.
Today is International Sloth Day, and your philosophy is that moving slowly, minimizing dirty dishes, and conserving human energy is an evolutionary virtue.

Analyze the given ingredients and craft the ultimate low-effort, high-comfort meal tailored specifically to the user's chosen sloth effort level.

STRICT REQUIREMENT: Respond ONLY with a valid JSON object matching this schema. No markdown formatting outside JSON, no explanation before or after.

{
  "detectedIngredients": ["item 1", "item 2", ...],
  "dishName": "Witty, delicious comfort food name",
  "tagline": "A funny, affectionate 1-line description celebrating sloth culture",
  "lazinessScore": 96,
  "prepTime": "2 mins",
  "cookTime": "5 mins",
  "dishesToWash": "1 Pan, 1 Fork (eat straight from pan to save a plate)",
  "effortBadge": "Level 1: Couch Sloth",
  "caloriesApprox": 420,
  "steps": [
    "Step 1 with minimal physical motion",
    "Step 2...",
    "Step 3..."
  ],
  "lazyGroceryList": [
    {"aisle": "Dairy / Refrigerated", "item": "Sharp cheddar block (shredding is optional)"},
    {"aisle": "Produce", "item": "Pre-washed spinach (no washing required)"},
    {"aisle": "Pantry", "item": "Crispy chili crunch"}
  ],
  "slothWisdom": "Sloan the Sloth says: Why rush when food tastes twice as good when you didn't have to break a sweat?"
}`;

        const userPrompt = `Ingredients available:
${ingredientsSummary}

Sloth Effort Mode: ${effortDescriptions[effortLevel] || effortDescriptions.couch}
Dietary Preference / Restrictions: ${diet}

Create the meal and missing grocery restock list now. Respond ONLY with valid JSON.`;

        let gemmaRaw = '';
        try {
          gemmaRaw = await queryOllama({
            model: modelToUse,
            prompt: userPrompt,
            system: systemPrompt
          });
        } catch (apiErr) {
          throw new Error(`Ollama generation failed: ${apiErr.message}`);
        }

        let parsedOutput;
        try {
          parsedOutput = extractJSON(gemmaRaw);
        } catch (jsonErr) {
          // Fallback structure if LLM didn't return strict JSON
          parsedOutput = {
            detectedIngredients: ingredientsSummary.split(',').map(s => s.trim()).filter(Boolean),
            dishName: "Sloth's Midnight Golden Skillet",
            tagline: "Minimum movement, maximum melted satisfaction.",
            lazinessScore: 95,
            prepTime: "2 mins",
            cookTime: "6 mins",
            dishesToWash: "1 Skillet, 1 Fork",
            effortBadge: effortLevel === 'couch' ? "Level 1: Couch Sloth" : "Level 2: One-Pan Sizzle",
            caloriesApprox: 450,
            steps: [
              "Toss whatever oil or butter you have into a warm pan.",
              "Dump in the cooked rice or bread, crack two eggs right on top, and sprinkle cheese generously.",
              "Cover with a lid for 4 minutes while you stare into space. Slide directly onto a napkin or eat from pan."
            ],
            lazyGroceryList: [
              { aisle: "Pantry", item: "Sriracha or hot honey" },
              { aisle: "Dairy", item: "Pre-sliced cheese" },
              { aisle: "Bakery", item: "Sourdough loaf" }
            ],
            slothWisdom: "Energy conserved today is energy stored for tomorrow's nap.",
            rawSnippet: gemmaRaw
          };
        }

        parsedOutput.inferenceTimeMs = Date.now() - startTime;
        parsedOutput.modelUsed = modelToUse;
        parsedOutput.sourceIngredients = ingredientsSummary;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsedOutput));
      } catch (err) {
        console.error('API Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  // Guard against path traversal
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦥 FridgeSloth server running at http://localhost:${PORT}`);
  console.log(`Connecting to local Ollama at ${OLLAMA_HOST}`);
});
