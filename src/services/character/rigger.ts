export interface PivotPoint {
  x: number;
  y: number;
}

export interface SkeletonPart {
  id: string;
  pivot: PivotPoint;
  parentId: string | null;
}

export interface Skeleton {
  parts: Record<string, SkeletonPart>;
}

export class RiggerService {
  /**
   * Automatically determines joints and pivot points for SVG parts.
   */
  static generateSkeleton(parts: string[]): Skeleton {
    const skeleton: Skeleton = { parts: {} };

    // Humanoid hierarchy logic
    const hierarchy: Record<string, string | null> = {
      "torso": null,
      "head": "torso",
      "left_arm": "torso",
      "right_arm": "torso",
      "left_leg": "torso",
      "right_leg": "torso"
    };

    // Default pivot points (normalized 0-1)
    const defaultPivots: Record<string, PivotPoint> = {
      "head": { x: 0.5, y: 0.9 },     // Bottom of head
      "torso": { x: 0.5, y: 0.5 },    // Center
      "left_arm": { x: 0.9, y: 0.1 },  // Top-right of arm (connected to torso)
      "right_arm": { x: 0.1, y: 0.1 }, // Top-left of arm
      "left_leg": { x: 0.5, y: 0.1 },  // Top of leg
      "right_leg": { x: 0.5, y: 0.1 }  // Top of leg
    };

    parts.forEach(partId => {
      skeleton.parts[partId] = {
        id: partId,
        pivot: defaultPivots[partId] || { x: 0.5, y: 0.5 },
        parentId: hierarchy[partId] ?? null
      };
    });

    return skeleton;
  }
}
