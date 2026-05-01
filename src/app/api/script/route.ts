import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scriptsDir = path.join(process.cwd(), 'public', 'scripts');
    
    if (!fs.existsSync(scriptsDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(scriptsDir)
      .filter(f => f.startsWith('compiled_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        id: f.replace('compiled_', '').replace('.json', ''),
        path: `/scripts/${f}`,
        mtime: fs.statSync(path.join(scriptsDir, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { filename, data } = await req.json();
    
    if (!filename || !filename.startsWith('compiled_') || !filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const scriptsDir = path.join(process.cwd(), 'public', 'scripts');
    const filePath = path.join(scriptsDir, filename);

    // Write back the formatted JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
