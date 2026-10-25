# FridgeSloth 🦥

> **100% Local, Zero-Effort Fridge-to-Feast Copilot & Grocery Butler Powered by Google DeepMind Gemma 3 Vision**
> *Channel your inner sloth. Never stand aimlessly with the fridge door open again.*

Built for the **[Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)** in celebration of **International Sloth Day**.

---

## 🦥 What It Does

The average person spends **14 minutes every day** standing in front of an open refrigerator with the door ajar, staring blankly into the cold void waiting for culinary divine inspiration. That is over **85 hours a year** of decision paralysis, lost metabolic energy, and cold air escaping into the kitchen.

**FridgeSloth** solves this with open-source AI:

1. **Visual Fridge & Pantry Scan (Multimodal Gemma 3 Vision)**:
   Snap or drop a photo of your messy fridge, freezer, or pantry shelf. Google Gemma 3 Vision inspects the photo **100% locally on your laptop**—detecting ingredients, half-used jars, condiments, wilted greens, and leftovers.
2. **The Sloth Effort Dial**:
   - 🛋️ **Level 1: Couch Sloth** (1 bowl / 1 mug, microwave or kettle only, 0 knives, < 4 mins)
   - 🍳 **Level 2: One-Pan Sizzle** (1 skillet, 1 spatula, minimal chopping, < 8 mins)
   - 🍲 **Level 3: Gentle Simmer** (Dump in pot, set low heat, lie back down on the rug, < 15 mins)
3. **Minimum Motion Recipes**:
   Generates delicious comfort food tailored specifically to minimize dirty dishes and physical exertion (e.g. *"eat straight from the skillet to save a plate"*).
4. **Missing Restock Grocery List**:
   Identifies essential missing staples that will make future lazy meals effortless, categorized by supermarket aisle so you don't wander.
5. **Sloan the Sloth Wisdom**:
   Affirmations celebrating the biological wisdom of moving slow, resting, and conserving energy.
6. **Zero-Telemetry Air-Gapped Privacy**:
   No photos of your home, living space, or dietary habits ever leave your machine. Runs with Wi-Fi turned off.

---

## 🏗️ Architecture

```plaintext
┌────────────────────────────────────────────────────────┐
│                   Browser Front-End                     │
│    • Drag & Drop Fridge Photo                          │
│    • Sloth Energy Dial (Couch / Skillet / Simmer)      │
│    • Visual Recipe & Aisle-Sorted Grocery Restock      │
└───────────────────────────┬────────────────────────────┘
                            │
               POST /api/analyze (Local HTTP)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               FridgeSloth Node.js Engine               │
│               (Zero External Dependencies)             │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
      Image Base64 Scan              Text Prompt
              │                            │
              ▼                            ▼
┌────────────────────────────────────────────────────────┐
│            Google DeepMind Gemma 3 (4B Vision)         │
│               Running via Local Ollama                 │
│               http://127.0.0.1:11434                   │
│                                                        │
│   • Multimodal Visual Feature Detection               │
│   • Minimum-Motion Recipe Synthesis                    │
│   • Restock Grocery Categorization                     │
│   • Zero Cloud Egress (0.00 KB Leaked)                │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Why Open Innovation Matters Here

1. **Kitchen & Home Privacy**:
   A photograph of the inside of your refrigerator reveals intimate details about your life: medications (like insulin kept in the butter keeper), family dietary patterns, income brackets, alcohol consumption, and even reflections of your home. Sending home photos to corporate cloud APIs creates an unnecessary surveillance vector. With open-weight Gemma 3, every single pixel is processed purely inside local memory and discarded immediately.
2. **Zero Marginal Cost ($0.00 Forever)**:
   Closed cloud multimodal APIs (GPT-4o, Claude 3.5 Sonnet) charge ~$0.02 per image plus token fees. Scanning your fridge twice a day costs $15–$25 a month. Running Gemma 3 on your own hardware costs literally $0.00.
3. **Offline Resilience (Kitchen Dead Zones)**:
   Kitchens, basements, and pantries frequently have poor Wi-Fi. FridgeSloth runs completely offline without any internet connection.
4. **Hackable & Transparent**:
   Open weights allow builders to adjust prompt behaviors, temperature, and quantization, without corporate moderation filters deciding what you can cook.

---

## 🚀 Quickstart

### Prerequisites

- **Node.js** (v18+)
- **Ollama** installed ([ollama.com](https://ollama.com))
- Pull Google Gemma 3:
  ```bash
  ollama pull gemma3:4b
  ```

### Run FridgeSloth

```bash
git clone https://github.com/adibafna/fridgesloth
cd fridgesloth

# Zero npm install required! Start immediately:
node server.js
```

Open your browser to:
```
http://localhost:3000
```

---

## 📜 License

MIT License. Built with open weights from Google DeepMind Gemma 3 and Ollama.
