// description: This example demonstrates how to use a Container to group and manipulate multiple sprites
import { Application, Assets, Container, AnimatedSprite, Spritesheet, type SpritesheetData, Texture, Sprite, Color, Point, FederatedPointerEvent } from 'pixi.js';
import { parseDmiToPixi } from './dmiparser';
import 'pixi.js/math-extras';


interface Appearance {
    Id: number;
    Name :string;
    Desc :string | null;
    Icon :number | null ;
    IconState: string | null;
    Direction: number;
    InheritsDirection: boolean;   // Inherits direction when used as an overlay
    PixelOffset: {X:number, Y:number};   // pixel_x and pixel_y
    PixelOffset2: {X:number, Y:number};  // pixel_w and pixel_z
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
    MaptextSize:Point; 
    MaptextOffset: Point;
    Maptext:string | null ;
    EnabledMouseEvents: number;
    MouseDragPointer:number ;
    MouseDropZone : boolean;
    MouseOverPointer: number;
    MouseDropPointer: number;

    /// <summary> The Transform property of this appearance, in [a,d,b,e,c,f] order</summary>
    Transform:number[];

    // PixelOffset2 behaves the same as PixelOffset in top-down mode, so this is used
    //TotalPixelOffset: Point => PixelOffset + PixelOffset2;
}

interface Entity {
    EntityId: number;
    Transform: {
      X: number,
      Y: number
    },
    Sprite: number
}

interface Resource {
    Id: number;
    ResourceData: string,
    ResourcePath: string,
    DMIStates: string,
}

class SpriteWrapper {
    Sprite: Sprite;
    Appearance: Appearance;
    Position: Point;

    Icon: number | null;
    IconState: string;
    Layer: number;
    Plane: number;
    ClickUid: number;
    MouseOpacity: number;

    constructor(appearance: Appearance, worldPosition: Point, parent: SpriteWrapper | undefined = undefined){
        if(isNaN(worldPosition.x) || isNaN(worldPosition.y)) {
            throw `Attempted to render an appearance (${appearance.Id}: "${appearance.Name}") at invalid position ${worldPosition}`
        }

        this.Appearance = appearance;
        this.Position = worldPosition
        this.Position.x += this.Appearance.PixelOffset.X;
        this.Position.y += this.Appearance.PixelOffset.Y;
        this.Icon = appearance.Icon;
        
        if(this.Appearance.IconState === null)
            this.IconState = parent?.IconState || ""
        else
            this.IconState = this.Appearance.IconState;

        const texture = getTexture(this.Icon, this.IconState, appearance.Direction);
        if(!texture){
            throw `Failed to get texture for appearance (${appearance.Id}: "${appearance.Name}"): ${this.Icon}, '${this.IconState}', ${appearance.Direction}`;
        }    
        
        if(texture.length == 1){
            this.Sprite = new Sprite(texture[0])
        } else {
            this.Sprite = new AnimatedSprite(texture)
        }
        this.Sprite.position = this.Position;
        this.Sprite.eventMode = 'static';
        this.Sprite.on('pointerdown', this.onMouseDown.bind(this))

        if (parent) {
            this.ClickUid = parent.ClickUid;
            this.MouseOpacity = parent.MouseOpacity;
            // if ((icon.Appearance.AppearanceFlags & AppearanceFlags.ResetColor) != 0 || keepTogether) { //RESET_COLOR
            //     this.ColorToApply = icon.Appearance.Color;
            //     this.ColorMatrixToApply = icon.Appearance.ColorMatrix;
            // } else {
            //     this.ColorToApply = parent.ColorToApply * icon.Appearance.Color;
            //     ColorMatrix.Multiply(in parent.ColorMatrixToApply, in icon.Appearance.ColorMatrix, out this.ColorMatrixToApply);
            // }

            // if ((icon.Appearance.AppearanceFlags & AppearanceFlags.ResetAlpha) != 0 || keepTogether) //RESET_ALPHA
            //     this.AlphaToApply = icon.Appearance.Alpha / 255.0f;
            // else
            //     this.AlphaToApply = parent.AlphaToApply * (icon.Appearance.Alpha / 255.0f);

            // if ((icon.Appearance.AppearanceFlags & AppearanceFlags.ResetTransform) != 0 || keepTogether) //RESET_TRANSFORM
            //     this.TransformToApply = iconAppearanceTransformMatrix;
            // else
            //     this.TransformToApply = iconAppearanceTransformMatrix * parent.TransformToApply;

            if ((this.Appearance.Plane < -10000)) //FLOAT_PLANE - Note: yes, this really is how it works. Yes it's dumb as shit.
                this.Plane = parent.Plane + (this.Appearance.Plane + 32767);
            else
                this.Plane = this.Appearance.Plane;

            //FLOAT_LAYER - if this icon's layer is negative, it's a float layer so set it's layer equal to the parent object and sort through the float_layer shit later
            this.Layer = (this.Appearance.Layer < 0) ? parent.Layer : this.Appearance.Layer;

            // if (this.BlendMode == BlendMode.Default)
            //     this.BlendMode = parent.BlendMode;
        } else {
            // this.ColorToApply = icon.Appearance.Color;
            // this.ColorMatrixToApply = icon.Appearance.ColorMatrix;
            // this.AlphaToApply = icon.Appearance.Alpha / 255.0f;
            // this.TransformToApply = iconAppearanceTransformMatrix;
            if(this.Appearance.Plane < -10000)
                console.warn(`Float plane requested with no parent appearance (${appearance.Id}: "${appearance.Name}")`)
            if(this.Appearance.Layer < 0)
                console.warn(`Float layer requested with no parent appearance (${appearance.Id}: "${appearance.Name}")`)
            this.Plane = this.Appearance.Plane;
            this.Layer = Math.max(0, this.Appearance.Layer); //float layers are invalid for icons with no parent
            this.MouseOpacity = this.Appearance.MouseOpacity;
            this.ClickUid = 0; // todo entity id
        }

        //special handling for EFFECTS_LAYER and BACKGROUND_LAYER
        //SO IT TURNS OUT EFFECTS_LAYER IS JUST A LIE *scream
        //and BACKGROUND_LAYER is basically the same behaviour as FLOAT_PLANE
        if (this.Layer >= 20000) {
            this.Layer -= 40000;
            // this.IsScreen = false; //BACKGROUND_LAYER renders behind everything on that plane
        }


        //DM layer = PIXI sprite.zIndex
        //DM plane = PIXI parent Container
        this.Sprite.zIndex = this.Layer;
        let plane:Container|undefined = planeCache.get(this.Plane)
        if(!plane){
            plane = new Container({isRenderGroup: true, zIndex:this.Plane});
            planeCache.set(this.Plane, plane)
        }
        plane.addChild(this.Sprite);
        
        for(let underlay of this.Appearance.Underlays){
            const underlaySprite = new SpriteWrapper(underlay, this.Position, this)
            underlaySprite.Sprite.position = underlaySprite.Sprite.position.subtract(this.Sprite.position);
            this.Sprite.addChild(underlaySprite.Sprite);
        }

        for(let overlay of this.Appearance.Overlays){
            const overlaySprite = new SpriteWrapper(overlay, this.Position, this)
            overlaySprite.Sprite.position = overlaySprite.Sprite.position.subtract(this.Sprite.position);
            this.Sprite.addChild(overlaySprite.Sprite)
        }

    }

    onMouseDown(event:FederatedPointerEvent){
        console.log(`Clicked ${this.Appearance.Name} at position ${this.Position} sprite position ${this.Sprite.position}`)
    }
}


const textureCache = new Map<Number, Spritesheet>();
const appearanceCache = new Map<Number, Appearance>()
let map_tiles: number[][] = [];
let entities: Entity[];

const planeCache = new Map<number, Container>();

async function loadTexturesIntoCache() {    
    const response = await fetch('src/assets/resources.json')
    const dataArray:Resource[] = await response.json();

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

function getTexture(resourceId:number|null, iconState:string, iconDir:number):Texture[]|undefined {
    if(resourceId === null)
        return [Texture.EMPTY];

    const dmi = textureCache.get(resourceId);
    if(!dmi)
        throw new Error(`Invalid DMIResource requested! ${resourceId} ${iconState} ${iconDir}`)

    if(!iconState){
        //get the blank or first iconstate
        return dmi.animations["anim_:::DEFAULT:::"] || dmi.animations[Object.keys(dmi.animations)[0]]
    }
    //get the targetted or first iconstate
    if(`anim_${iconState}` in dmi.animations)
        return dmi.animations[`anim_${iconState}`] 
    else {
        console.warn(`Returning default state for invalid icon state ${iconState} requested on resource ${resourceId}`)
        return dmi.animations[Object.keys(dmi.animations)[0]];
    } 
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
        const tileAppearance = appearanceCache.get(map_tiles[x][y])
        if(!tileAppearance)
            continue;
        new SpriteWrapper(tileAppearance, new Point(x * 32, maxy - y * 32))
    }
  }

  console.log(`Rendering ${entities.length} entities`)
  // and now the entities...
  for(const ent of entities){
    if(ent.Sprite == 0) //default appearance, don't render
        continue;
    const entAppearance = appearanceCache.get(ent.Sprite)
    if(!entAppearance)
        continue;
    new SpriteWrapper(entAppearance, new Point((ent.Transform.X-1)*32, maxy - ent.Transform.Y*32))
  }

  for(const [planeNum, plane] of planeCache){
    container.addChild(plane)
    console.log(`adding plane ${planeNum} with ${plane.children.length} children at ${plane.position}`)
  }
  // Move the container to the center
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Center the pivot in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;
  let currKey = new Map<string, boolean>([
    ["a", false],
    ["w", false],
    ["s", false],
    ["d", false]
    ])

    document.addEventListener("keydown",(ev)=>{
        currKey.set(ev.key, true)
    })
    document.addEventListener("keyup",(ev)=>{
        currKey.set(ev.key, false)
    })

    app.ticker.add((time)=>{
        if(currKey.get("d")){
            container.x += 10 * time.deltaTime
        }
        if(currKey.get("s")){
            container.y += 10 * time.deltaTime
        }
        if(currKey.get("a")){
            container.x -= 10 * time.deltaTime
        }
        if(currKey.get("w")){
            container.y -= 10 * time.deltaTime
        }
    })

  return  app.canvas;
}
