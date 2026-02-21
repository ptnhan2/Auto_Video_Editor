import { describe, it, expect } from 'vitest';
import { generateCharacterWithBlueprint } from './nano-banana';

describe('Nano Banana Pro Integration', () => {
  it('should generate a character using a blueprint reference', async () => {
    const request = {
      prompt: "A futuristic robot explorer",
      blueprintId: "standard-humanoid-v1",
      referenceImageUrl: "https://example.com/blueprints/humanoid.png",
      strength: 1.0,
    };

    const response = await generateCharacterWithBlueprint(request);

    expect(response).toBeDefined();
    expect(response.imageUrl).toContain('http');
    expect(response.metadata.alignmentScore).toBeGreaterThan(0.9);
  });
});
