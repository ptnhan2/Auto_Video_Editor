/**
 * GET /api/assets/tts/[id] — Stream một file TTS audio từ public/assets/audio/tts/.
 *
 * Đọc file nhị phân (mp3) theo id, trả về với headers đúng chuẩn âm thanh
 * (Content-Type, Accept-Ranges, Content-Range) để OpenCut-AI có thể fetch
 * toàn bộ file lúc import (local ingestion) và stream-play ở các phase sau.
 *
 * Path params:
 *   id - TTS audio id (basename, không gồm đuôi .mp3). VD: "aud_sb019e2499".
 *
 * @param req  - Incoming Request (Web API). Range header tuỳ chọn.
 * @param ctx  - Next.js dynamic route context; `params` là Promise<{ id }>.
 * @returns Response với body là audio binary (200/206), hoặc JSON error (400/404/500).
 * @sideEffect Đọc file từ filesystem (public/assets/audio/tts/<id>.mp3), read-only.
 */

import { NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// ── Constants ──────────────────────────────────────────────────────────────

/** Thư mục gốc chứa TTS audio, tương đối với cwd của Next.js server. */
const TTS_DIR = path.resolve(process.cwd(), 'public', 'assets', 'audio', 'tts');

/**
 * Whitelist ký tự an toàn cho id: chữ+số+gạch dưới+gạch ngang.
 * Bất kỳ ký tự nào khác (kể cả `/`, `\`, `.`, `..`) đều bị reject → chặn path traversal.
 */
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

const CONTENT_TYPE = 'audio/mpeg';

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(
	req: Request,
	ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
	const { id } = await ctx.params;

	// -- Validate id (chống path traversal) --

	if (!id || !SAFE_ID.test(id)) {
		return NextResponse.json(
			{ error: 'Invalid asset id' },
			{ status: 400 },
		);
	}

	const filePath = path.join(TTS_DIR, `${id}.mp3`);

	try {
		// -- Kiểm tra file tồn tại --

		if (!existsSync(filePath)) {
			return NextResponse.json(
				{ error: 'Asset not found' },
				{ status: 404 },
			);
		}

		const { size } = statSync(filePath);
		const buffer = readFileSync(filePath);

		// -- Parse Range header (bytes=start-end) nếu có --

		const rangeHeader = req.headers.get('Range');
		const rangeMatch = rangeHeader
			? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
			: null;

		if (rangeMatch) {
			const start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : 0;
			const end = rangeMatch[2]
				? parseInt(rangeMatch[2], 10)
				: size - 1;
			const clampedEnd = Math.min(end, size - 1);

			if (start > clampedEnd || start >= size) {
				return NextResponse.json(
					{ error: 'Range not satisfiable' },
					{ status: 416 },
				);
			}

			const slice = buffer.subarray(start, clampedEnd + 1);
			return new Response(slice, {
				status: 206,
				headers: {
					'Content-Type': CONTENT_TYPE,
					'Accept-Ranges': 'bytes',
					'Content-Range': `bytes ${start}-${clampedEnd}/${size}`,
					'Content-Length': String(slice.length),
				},
			});
		}

		// -- Phản hồi đầy đủ (200) --

		return new Response(buffer, {
			status: 200,
			headers: {
				'Content-Type': CONTENT_TYPE,
				'Accept-Ranges': 'bytes',
				'Content-Length': String(size),
			},
		});
	} catch (error) {
		console.error(`GET /api/assets/tts/${id} error:`, error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}
