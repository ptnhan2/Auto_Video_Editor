import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const bgDir = path.join(process.cwd(), 'public/assets/background');
  
  if (!fs.existsSync(bgDir)) {
    return NextResponse.json({ backgrounds: [] });
  }

  const files = fs.readdirSync(bgDir);
  const backgrounds = files
    .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
    .map(file => ({
      id: file,
      name: file,
      path: `/assets/background/${file}`
    }));

  return NextResponse.json({ backgrounds });
}
