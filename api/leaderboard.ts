
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

export default async function handler(req: NextRequest) {
  // Добавляем проверку, чтобы убедиться, что Vercel KV настроен.
  // Это помогает в отладке проблем с развертыванием.
  if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
    const errorMessage = "Vercel KV не настроен. Пожалуйста, настройте Vercel KV и свяжите его с этим проектом в настройках Vercel.";
    console.error(errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      }
    );
  }

  // Обработка pre-flight запросов от браузера (стандартная процедура для CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // --- ОБРАБОТКА GET-ЗАПРОСОВ (Получение рекордов) ---
    if (req.method === 'GET') {
      const scores = await kv.get<Score[]>(LEADERBOARD_KEY);
      // Если рекордов еще нет, возвращаем пустой массив
      const data = scores || [];
      return NextResponse.json(data, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // --- ОБРАБОТКА POST-ЗАПРОСОВ (Добавление рекорда) ---
    if (req.method === 'POST') {
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
    }

    // Если метод запроса не GET, POST или OPTIONS
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (e: any) {
    console.error("API Error:", e.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
