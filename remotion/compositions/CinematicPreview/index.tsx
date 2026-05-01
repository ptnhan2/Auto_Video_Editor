import React from "react";
import { AbsoluteFill } from "remotion";
import { BackgroundLayer } from "../SceneCompiler";
import { InteractionEffect } from "../../components/InteractionEffect";

export interface CinematicPreviewProps {
  backgroundId: string;
  layoutStyle: string;
  visualMetaphor: string;
  transitionIn: string;
  atmosphereFx: string;
  assetDynamics: string;
}

export const CinematicPreview: React.FC<CinematicPreviewProps> = ({
  backgroundId,
  layoutStyle,
  visualMetaphor,
  transitionIn,
  atmosphereFx,
  assetDynamics,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <BackgroundLayer backgroundId={backgroundId} />
      
      <AbsoluteFill>
        <InteractionEffect
          durationFrames={60}
          layoutStyle={layoutStyle !== 'none' ? layoutStyle : null}
          visualMetaphor={visualMetaphor !== 'none' ? visualMetaphor : null}
          transitionIn={transitionIn !== 'none' ? transitionIn : null}
          atmosphereFx={atmosphereFx !== 'none' ? atmosphereFx : null}
          assetDynamics={assetDynamics !== 'none' ? assetDynamics : null}
          layerType="under_actors"
        />
        
        {/* Placeholder cho Nhân vật để nhìn rõ Layer Overlay */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 600,
          border: "4px dashed rgba(255, 255, 255, 0.5)",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: 32,
          fontWeight: "bold",
          fontFamily: "sans-serif"
        }}>
          ACTOR
        </div>

        <InteractionEffect
          durationFrames={60}
          layoutStyle={layoutStyle !== 'none' ? layoutStyle : null}
          visualMetaphor={visualMetaphor !== 'none' ? visualMetaphor : null}
          transitionIn={transitionIn !== 'none' ? transitionIn : null}
          atmosphereFx={atmosphereFx !== 'none' ? atmosphereFx : null}
          assetDynamics={assetDynamics !== 'none' ? assetDynamics : null}
          layerType="over_actors"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
