import { type SpritesheetData } from 'pixi.js';

export interface DmiState {
    name: string;
    dirs: number;
    frames: number;
    delay?: number[];
    rewind?: boolean;
}

export function parseDmiToPixi(dmiText: string, imageUrl: string = "spritesheet.png"): SpritesheetData {
    const lines = dmiText.split('\n').map(line => line.trim());
    
    let width = 32;
    let height = 32;
    const states: DmiState[] = [];
    let currentState: Partial<DmiState> | null = null;

    // 1. Parse Dmi Text into structured objects
    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;

        const [key, val] = line.split('=').map(s => s.trim());
        
        if (key === 'width') width = parseInt(val, 10);
        else if (key === 'height') height = parseInt(val, 10);
        else if (key === 'state') {
            if (currentState && currentState.name) {
                states.push(currentState as DmiState);
            }
            // Remove surrounding quotes from state name
            currentState = { name: val.replace(/^"|"$/g, '') };
            if(!currentState.name)
                currentState.name = ":::DEFAULT:::"
        } else if (currentState) {
            if (key === 'dirs') currentState.dirs = parseInt(val, 10);
            else if (key === 'frames') currentState.frames = parseInt(val, 10);
            else if (key === 'delay') currentState.delay = val.split(',').map(Number);
            else if (key === 'rewind') currentState.rewind = val === '1';
        }
    }
    // Push the last state
    if (currentState && currentState.name) {
        states.push(currentState as DmiState);
    }

    // 2. Build PixiJS Spritesheet JSON
    const pixiJson: SpritesheetData = {
        frames: {},
        meta: {
            image: imageUrl,
            format: "RGBA8888",
            scale: 1,
            size: { w: 0, h: 0 } // Will be calculated based on total frames
        },
        animations: {}
    };

    let globalFrameIndex = 0;

    for (const state of states) {
        const animationFrames: string[] = [];
        const totalFramesInState = state.frames * state.dirs;

        for (let i = 0; i < totalFramesInState; i++) {
            const frameKey = `frame_${state.name}_${i}`;
            animationFrames.push(frameKey);

            // DMI stores frames sequentially. Let's assume a standard sprite grid.
            // Note: If you know the actual texture width, replace `10` with (textureWidth / width)
            const framesPerRow = 10; 
            const col = globalFrameIndex % framesPerRow;
            const row = Math.floor(globalFrameIndex / framesPerRow);

            const x = col * width;
            const y = row * height;

            pixiJson.frames[frameKey] = {
                frame: { x, y, w: width, h: height },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: width, h: height },
                sourceSize: { w: width, h: height }
            };

            // Add frame delay (DMI typically uses 1/10th of a second ticks)
            // if (state.delay && state.delay[i % state.frames]) {
            //     pixiJson.somethign += state.delay[i % state.frames] * 100;
            // }

            globalFrameIndex++;
        }

        // Add to animations block for easy playback in Pixi
        if (pixiJson.animations) {
            pixiJson.animations[`anim_${state.name}`] = animationFrames;
        }
    }

    // Rough estimate of canvas size based on our arbitrary grid
    const maxCols = Math.min(globalFrameIndex, 10);
    const maxRows = Math.ceil(globalFrameIndex / 10);
    pixiJson.meta.size = { w: maxCols * width, h: maxRows * height };

    return pixiJson;
}