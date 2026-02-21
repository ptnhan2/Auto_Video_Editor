import { describe, it, expect } from "vitest";
import { CharacterPipeline } from "./character-pipeline";
import { useCharacterLibraryStore } from "./character-store";

describe("CharacterPipeline Integration Test", () => {
  it("should process a character image and add it to the library", async () => {
    console.log("Starting CharacterPipeline integration test...");
    
    const mockImage = Buffer.from("fake-image-data-representing-character");
    const name = "Hero Character";

    console.log(`Processing character: ${name}`);
    const character = await CharacterPipeline.processNewCharacter(mockImage, name);

    console.log("Character processed successfully.");
    console.log("Resulting ID:", character.id);
    console.log("Skeleton Parts:", Object.keys(character.skeleton.parts).join(", "));

    // Assertions
    expect(character).toBeDefined();
    expect(character.name).toBe(name);
    expect(character.svgContent).toContain("<svg");
    expect(character.skeleton).toBeDefined();
    expect(Object.keys(character.skeleton.parts)).toContain("head");
    expect(Object.keys(character.skeleton.parts)).toContain("torso");

    const store = useCharacterLibraryStore.getState();
    const isStored = store.characters.some(c => c.id === character.id);
    console.log("Is character stored in library?", isStored);
    
    expect(isStored).toBe(true);
    
    console.log("Test completed successfully.");
  });
});
