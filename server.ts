import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Assistant endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, circuitState } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Mensaje requerido.' });
      }

      const ai = getAI();
      const systemInstruction = `Eres un Ingeniero Eléctrico Senior consultor experto en normativas eléctricas (NEC NFPA 70, ENSA, Naturgy).
Tu objetivo es analizar diagramas unifilares, acometidas, tableros de medición múltiples, transformadores, motores y protecciones.
Explica de manera concisa y profesional cómo corregir calibres (AWG hasta 500 kcmil), capacidades de interruptores (amperaje), caída de tensión (% < 3%), tuberías conduit y balance de fases.
Si detectas un error o una pregunta de cálculo, entrega una recomendación directa con valores sugeridos en español.`;

      const prompt = `Información del circuito actual:
${JSON.stringify(circuitState || {}, null, 2)}

Pregunta del usuario:
${message}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      return res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Error en Gemini Chat:', error?.message);
      return res.status(500).json({
        error: error?.message || 'Error al comunicarse con el modelo Gemini.',
      });
    }
  });

  // Serve public directory static files
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Eléctrico Unifilar activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
