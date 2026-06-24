import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { bgFile, data } = await req.json();

    if (!bgFile || !data) {
      return NextResponse.json({ error: 'Missing bgFile or data' }, { status: 400 });
    }

    const bgDir = path.join(process.cwd(), 'public/assets/background');
    const jsonFile = bgFile.replace(/\.[^/.]+$/, "") + ".json";
    const jsonPath = path.join(bgDir, jsonFile);

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save JSON' }, { status: 500 });
  }
}
