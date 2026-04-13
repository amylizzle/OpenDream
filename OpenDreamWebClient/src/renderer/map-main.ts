// description: This example demonstrates how to use a Container to group and manipulate multiple sprites
import { Application, Assets, Container, AnimatedSprite, Spritesheet, type SpritesheetData, Texture, Sprite, Color, RenderGroup } from 'pixi.js';

interface DmiState {
    name: string;
    dirs: number;
    frames: number;
    delay?: number[];
    rewind?: boolean;
}

interface Appearance {
    Id: number;
    Name :string;
    Desc :string | null;
    Icon :number | null ;
    IconState: string | null;
    Direction: number;
    InheritsDirection: boolean;   // Inherits direction when used as an overlay
    PixelOffset:Vector2Math;   // pixel_x and pixel_y
    PixelOffset2:Vector2Math;  // pixel_w and pixel_z
    Color: Color; 
    Alpha: number; 
    GlideSize: number;
    Layer: number;
    Plane: number;
    BlendMode: number; 
    AppearanceFlags: number;
    Invisibility: number; 
    Opacity: boolean;
    Override: boolean; 
    RenderSource: string | null;
    RenderTarget: string | null; 
    MouseOpacity: number;
    Overlays: Appearance[];
    Underlays: Appearance[];
    VisContents: number[];
    Filters: Object[];
    Verbs: number[];
    ColorMatrix: Object;
    MaptextSize:Vector2Math; 
    MaptextOffset: Vector2Math;
    Maptext:string | null ;
    EnabledMouseEvents: number;
    MouseDragPointer:number ;
    MouseDropZone : boolean;
    MouseOverPointer: number;
    MouseDropPointer: number;

    /// <summary> The Transform property of this appearance, in [a,d,b,e,c,f] order</summary>
     Transform:number[];

    // PixelOffset2 behaves the same as PixelOffset in top-down mode, so this is used
    //TotalPixelOffset: Vector2Math => PixelOffset + PixelOffset2;
}

interface Entity {
    EntityId: number;
    Transform: {
      X: number,
      Y: number
    },
    Sprite: number
}

const textureCache = new Map<Number, Spritesheet>();
const appearanceCache = new Map<Number, Appearance>()
let map_tiles: number[][] = [];
let entities: Entity[];

const planeCache = new Map<number, Container>();

async function loadTexturesIntoCache() {    
    const response = await fetch('src/assets/resources.json')
    const dataArray = await response.json();

    console.log(`Loading ${dataArray.length} assets...`);
    
    for (const item of dataArray) {       
        
        try {
            // Create a data URL from the base64 string
            const dataUrl = `data:image/png;base64,${item.ResourceData}`;
            // parse DMI states into spritesheet info for pixi
            const spritesheet = parseDmiToPixi(item.DMIStates, dataUrl)
            
            const sheetTexture = await Assets.load(dataUrl);
            const sheet = new Spritesheet(sheetTexture, spritesheet);
            await sheet.parse();
            textureCache.set(item.Id, sheet);
            
            console.log(`Loaded: ${item.ResourcePath} as ID: ${item.Id}`);
        } catch (err) {
            console.error(`Failed to load ID ${item.Id}:`, err);
        }
    }
    
    console.log("Loaded all spritesheets.");
}

function parseDmiToPixi(dmiText: string, imageUrl: string = "spritesheet.png"): SpritesheetData {
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

async function loadMap(): Promise<any> {
  const response = await fetch('src/assets/tileids.json')
  map_tiles = await response.json()
}

async function loadEntities(): Promise<any> {
  const response = await fetch('src/assets/entities.json')
  entities = await response.json()
}

async function loadAppearances(): Promise<any> {
  const response = await fetch('src/assets/appearances.json')
  const appearances = await response.json()
  for(const ap of appearances){
    appearanceCache.set(ap.Id, ap);
  }

}

async function getTexture(resourceId:number, iconState:string, iconDir:number):Promise<Texture[]|undefined> {
    const dmi = textureCache.get(resourceId);
    if(!dmi)
        throw new Error(`Invalid DMIResource requested! ${resourceId} ${iconState} ${iconDir}`)

    if(!iconState)
        return dmi.animations["anim_:::DEFAULT:::"]
    return dmi.animations[`anim_${iconState}`]

}

async function getSprite(appearanceId:number, parent:Sprite | undefined = undefined):Promise<Sprite|AnimatedSprite|undefined>{
    const entAppearance = appearanceCache.get(appearanceId)!
    if(!entAppearance){
        console.error(`Couldn't find appearance ${appearanceId}!`)
        return undefined;
    }    
    if(!entAppearance.Icon || !entAppearance.IconState){
        console.warn(`Should probably be grabbing parent icon here? ${parent?.position}`)
        return;
    }
    const texture = await getTexture(entAppearance.Icon, entAppearance.IconState, entAppearance.Direction);
    if(!texture){
        console.error(`Failed to get texture for ${entAppearance.Icon}, ${entAppearance.IconState}, ${entAppearance.Direction}`)
        return undefined;
    }    
    let result: Sprite
    if(texture.length == 1){
        result = new Sprite(texture[0])
    } else {
        result = new AnimatedSprite(texture)
    }

    //DM layer = PIXI zIndex
    //DM plane = PIXI RenderLayer
    result.zIndex = entAppearance.Layer;
    let plane:Container|undefined = planeCache.get(entAppearance.Plane)
    if(!plane){
        plane = new Container({isRenderGroup: true, zIndex:entAppearance.Plane});
        planeCache.set(entAppearance.Plane, plane)
    }
    plane.addChild(result);
    
    for(let underlay of entAppearance.Underlays){
        const underlaySprite = await getSprite(underlay.Id, result);
        if(underlaySprite)
            result.addChild(underlaySprite)
    }

    for(let overlay of entAppearance.Overlays){
        const overlaySprite = await getSprite(overlay.Id, result);
        if(overlaySprite)
            result.addChild(overlaySprite)
    }

    return result;
}


export async function CreateRenderer(parent:HTMLElement):Promise<HTMLCanvasElement> {
  // Create a new application
  const app = new Application();
  await loadTexturesIntoCache();
  await loadMap();
  await loadAppearances();
  await loadEntities();

  // Initialize the application
  await app.init({ background: '#000000', resizeTo: parent });
  // Create and add a container to the stage
  const container = new Container();
  app.stage.addChild(container);

  const maxy = map_tiles[0].length * 32;
  // Create the grid of tiles
  for (let x = 0; x < map_tiles.length; x++) {
    for (let y = 0; y < map_tiles[0].length; y++) {
        const tile = await getSprite(map_tiles[x][y])
        if(!tile)
            continue;
        tile.x = x * 32;
        tile.y = maxy - y * 32;
        // container.addChild(tile);
    }
  }

  console.log(`Rendering ${entities.length} entities`)
  // and now the entities...
  for(const ent of entities){
    if(ent.Sprite == 0) //default appearance, don't render
        continue;
    const sprite = await getSprite(ent.Sprite)
    if(!sprite)
        continue;
    sprite.x = (ent.Transform.X-1.0)*32;
    sprite.y = maxy - ent.Transform.Y*32;
    // container.addChild(sprite);
  }

  for(const [planeNum, plane] of planeCache){
    container.addChild(plane)
    console.log(`adding plane ${planeNum}`)
  }
  // Move the container to the center
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Center the pivot in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

//   // Listen for animate update
//   app.ticker.add((time) => {
//     // Continuously rotate the container!
//     // * use delta to create frame-independent transform *
//     container.rotation -= 0.01 * time.deltaTime;
//   });

  return  app.canvas;
}
