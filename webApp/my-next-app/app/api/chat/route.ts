import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const prompt = body?.prompt;

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return NextResponse.json(
      { error: 'Prompt is required.' },
      { status: 400 },
    );
  }

  const scriptPath = path.join(process.cwd(), 'app', 'chat-tool', 'ai_client.py');
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

  return new Promise<NextResponse>((resolve) => {
    const child = spawn(pythonCommand, [scriptPath, prompt], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = stderr.trim() || stdout.trim() || 'Failed to run the Python script.';
        resolve(
          NextResponse.json(
            { error: errorMessage },
            { status: 500 },
          ),
        );
        return;
      }

      resolve(NextResponse.json({ response: stdout.trim() }));
    });
  });
}
