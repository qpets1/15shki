
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// Используем Edge Runtime для максимальной скорости
export const runtime = 'edge';

interface Score {
  name: string;
  moves: number;
  time: number;
}

// Ключ, под которым мы храним данные в Vercel KV
const LEADERBOARD_KEY = 'leaderboard';

// --- ОБРАБОТКА GET-ЗАПРОСОВ (Получение рекордов) ---
export async function GET(req: NextRequest) {
  try {
    // Проверяем наличие учетных данных KV внутри try...catch блока.
    // Это гарантирует, что даже если импорт @vercel/kv вызывает ошибку из-за отсутствия env,
    // мы всё равно вернем корректный JSON-ответ.
    if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
      const errorMessage = "Vercel KV не настроен. Пожалуйста, настройте Vercel KV и свяжите его с этим проектом в настройках Vercel.";
      return NextResponse.json({ error: errorMessage }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const scores = await kv.get<Score[]>(LEADERBOARD_KEY);
    // Если рекордов еще нет, возвращаем пустой массив
    const data = scores || [];
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e: any) {
    console.error("API GET Error:", e.message);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера при получении рекордов.' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

// --- ОБРАБОТКА POST-ЗАПРОСОВ (Добавление рекорда) ---
export async function POST(req: NextRequest) {
  try {
    // Проверяем учетные данные и здесь
    if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
      const errorMessage = "Vercel KV не настроен. Пожалуйста, настройте Vercel KV и свяжите его с этим проектом в настройках Vercel.";
      return NextResponse.json({ error: errorMessage }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    
    const newScore: Score = await req.json();

    // Простая валидация
    if (!newScore || typeof newScore.name !== 'string' || typeof newScore.moves !== 'number' || typeof newScore.time !== 'number') {
      return NextResponse.json({ error: 'Invalid score format' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
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

    return NextResponse.json({ status: 'ok' }, { status: 201, headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e: any) {
    console.error("API POST Error:", e.message);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера при сохранении рекорда.' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

// --- ОБРАБОТКА OPTIONS-ЗАПРОСОВ (Для CORS) ---
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
