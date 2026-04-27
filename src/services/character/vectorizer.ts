import fs from "fs/promises";
import path from "path";

export interface VectorizedPart {
  id: string;
  svgPath: string;
}

export class VectorizerService {
  /**
   * Converts a binary mask (PNG) to SVG path using potrace or vtracer.
   */
  static async vectorizeMask(maskBuffer: Buffer, partId: string): Promise<string> {
    const outputDir = path.join(process.cwd(), "public", "assets", "characters", "parts");
    await fs.mkdir(outputDir, { recursive: true });
    
    const tempIn = path.join(outputDir, `${partId}.png`);
    const tempOut = path.join(outputDir, `${partId}.svg`);

    // Only write if buffer is not empty to avoid corrupted/empty files
    if (maskBuffer.length > 0) {
      await fs.writeFile(tempIn, maskBuffer);
    }

    try {
      // Using potrace CLI (assumed to be installed on the environment or Modal worker)
      // In a real production setup, we might use a WASM version of potrace or vtracer
      // For this implementation, we simulate the logic.
      
      // Placeholder for actual SVG content
      const svgContent = `<path id="${partId}" d="M 0 0 L 100 0 L 100 100 L 0 100 Z" />`;
      return svgContent;
    } finally {
      // We keep the files for user inspection in this stage
    }
  }

  /**
   * Combines multiple vectorized parts into a single SVG file.
   */
  static combineToSVG(parts: VectorizedPart[], width: number, height: number): string {
    const paths = parts.map(p => p.svgPath).join("\n");
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <g id="character-layers">
        ${paths}
      </g>
    </svg>`;
  }
}
