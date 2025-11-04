import { kv } from '@vercel/kv';

// Используем Edge Runtime для максимальной скорости
export const runtime = 'edge';

interface Score {
  name: string;
  moves: number;
  time: number;
}

// Ключ, под которым мы храним данные в Vercel KV
const LEADERBOARD_KEY = 'leaderboard';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Вспомогательная функция для создания JSON-ответов
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// --- ОБРАБОТКА GET-ЗАПРОСОВ (Получение рекордов) ---
export async function GET(req: Request) {
  try {
    // Проверяем наличие учетных данных KV внутри try...catch блока.
    if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
      const errorMessage = "Vercel KV не настроен. Пожалуйста, настройте Vercel KV и свяжите его с этим проектом в настройках Vercel.";
      return jsonResponse({ error: errorMessage }, 500);
    }

    const scores = await kv.get<Score[]>(LEADERBOARD_KEY);
    // Если рекордов еще нет, возвращаем пустой массив
    const data = scores || [];
    return jsonResponse(data);
  } catch (e: any) {
    console.error("API GET Error:", e.message);
    return jsonResponse({ error: 'Внутренняя ошибка сервера при получении рекордов.' }, 500);
  }
}

// --- ОБРАБОТКА POST-ЗАПРОСОВ (Добавление рекорда) ---
export async function POST(req: Request) {
  try {
    // Проверяем учетные данные и здесь
    if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
      const errorMessage = "Vercel KV не настроен. Пожалуйста, настройте Vercel KV и свяжите его с этим проектом в настройках Vercel.";
      return jsonResponse({ error: errorMessage }, 500);
    }
    
    const newScore: Score = await req.json();

    // Простая валидация
    if (!newScore || typeof newScore.name !== 'string' || typeof newScore.moves !== 'number' || typeof newScore.time !== 'number') {
      return jsonResponse({ error: 'Invalid score format' }, 400);
    }

    // Получаем текущий список рекордов
    const currentScores = await kv.get<Score[]>(LEADERBOARD_KEY) || [];

    // Добавляем новый результат
    currentScores.push(newScore);

    // Сортируем: сначала по ходам, потом по времени
    currentScores.sort((a, b) => {
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });

    // Оставляем только топ-5
    const topScores = currentScores.slice(0, 5);

    // Сохраняем обновленный список обратно в KV
    await kv.set(LEADERBOARD_KEY, topScores);

    return jsonResponse({ status: 'ok' }, 201);
  } catch (e: any) {
    console.error("API POST Error:", e.message);
    return jsonResponse({ error: 'Внутренняя ошибка сервера при сохранении рекорда.' }, 500);
  }
}

// --- ОБРАБОТКА OPTIONS-ЗАПРОСОВ (Для CORS) ---
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
