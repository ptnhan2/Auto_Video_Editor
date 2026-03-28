import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const bgDir = path.join(process.cwd(), 'public/assets/background');
  const jsonFile = id.replace(/\.[^/.]+$/, "") + ".json";
  const jsonPath = path.join(bgDir, jsonFile);

  if (!fs.existsSync(jsonPath)) {
    return NextResponse.json({ pois: [] });
  }

  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse JSON' }, { status: 500 });
  }
}
