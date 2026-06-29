import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import yahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// -- Tools & Data Fetching --
async function fetchCompanyProfile(ticker: string) {
  try {
    const profile = await yahooFinance.quoteSummary(ticker, { modules: ['assetProfile', 'financialData', 'defaultKeyStatistics'] });
    return JSON.stringify(profile, null, 2);
  } catch (error) {
    return JSON.stringify({ error: "Could not fetch company profile." });
  }
}

async function fetchHistoricalPrices(ticker: string) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const result: any = await yahooFinance.historical(ticker, { period1: startDate, period2: endDate, interval: '1d' });
    
    // Send just the last 10 days to keep context window manageable
    const recent = result.slice(-10).map(r => ({
      date: r.date,
      close: r.close,
      volume: r.volume
    }));
    return JSON.stringify(recent, null, 2);
  } catch (error) {
    return JSON.stringify({ error: "Could not fetch price data." });
  }
}

async function fetchRecentNews(ticker: string) {
  try {
    const news: any = await yahooFinance.search(ticker, { newsCount: 5 });
    return JSON.stringify(news.news, null, 2);
  } catch (error) {
    return JSON.stringify({ error: "Could not fetch news." });
  }
}

const fundamentalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bull_points: { type: Type.ARRAY, items: { type: Type.STRING } },
    bear_points: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: { type: Type.INTEGER }
  },
  required: ['bull_points', 'bear_points', 'confidence']
};

const technicalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    trend_regime: { type: Type.STRING },
    momentum_score: { type: Type.INTEGER },
    confidence: { type: Type.INTEGER }
  },
  required: ['trend_regime', 'momentum_score', 'confidence']
};

const sentimentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_sentiment: { type: Type.STRING, description: "BULLISH, BEARISH, or NEUTRAL" },
    catalysts: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: { type: Type.INTEGER }
  },
  required: ['overall_sentiment', 'catalysts', 'confidence']
};

const proposalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ticker: { type: Type.STRING },
    action: { type: Type.STRING, description: "BUY, SELL, or HOLD" },
    suggested_size_pct: { type: Type.INTEGER },
    rationale: { type: Type.STRING },
    disagreement_summary: { type: Type.STRING },
    confidence: { type: Type.INTEGER }
  },
  required: ['ticker', 'action', 'suggested_size_pct', 'rationale', 'disagreement_summary', 'confidence']
};

// -- API Routes --
app.post('/api/analyze', async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' });
  }

  try {
    // 1. Fetch data in parallel
    const [profile, prices, news] = await Promise.all([
      fetchCompanyProfile(ticker),
      fetchHistoricalPrices(ticker),
      fetchRecentNews(ticker)
    ]);

    // 2. Run Agents in Parallel
    const fundamentalPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Fundamental Analyst. Evaluate the following company profile and financials for ${ticker}: \n\n${profile}\n\nProvide bull points, bear points, and confidence.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: fundamentalSchema,
        temperature: 0.2
      }
    });

    const technicalPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Technical Analyst. Analyze the following 10-day price history for ${ticker}: \n\n${prices}\n\nIdentify the trend regime, give a momentum score (0-100), and state your confidence.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: technicalSchema,
        temperature: 0.2
      }
    });

    const sentimentPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Sentiment Analyst. Evaluate the following recent news for ${ticker}: \n\n${news}\n\nIdentify overall sentiment, key catalysts, and your confidence.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: sentimentSchema,
        temperature: 0.2
      }
    });

    const [fundamentalRes, technicalRes, sentimentRes] = await Promise.all([
      fundamentalPromise, technicalPromise, sentimentPromise
    ]);

    const fundamentalData = JSON.parse(fundamentalRes.text || "{}");
    const technicalData = JSON.parse(technicalRes.text || "{}");
    const sentimentData = JSON.parse(sentimentRes.text || "{}");

    // 3. Coordinator Agent
    const coordinatorPrompt = `
You are the Portfolio Coordinator. Synthesize the following agent reports for ${ticker} and make a final trade proposal.

Fundamental Report: ${JSON.stringify(fundamentalData)}
Technical Report: ${JSON.stringify(technicalData)}
Sentiment Report: ${JSON.stringify(sentimentData)}

Output your final trade proposal according to the schema.
`;

    const coordinatorRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: coordinatorPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: proposalSchema,
        temperature: 0.4
      }
    });

    const proposalData = JSON.parse(coordinatorRes.text || "{}");

    res.json({
      ticker,
      fundamental: fundamentalData,
      technical: technicalData,
      sentiment: sentimentData,
      proposal: proposalData
    });

  } catch (error: any) {
    console.error("Error analyzing ticker:", error);
    res.status(500).json({ error: error.message || "Failed to analyze ticker" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
