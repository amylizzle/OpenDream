import './style.css'
import { DMFLexer } from './DMF/dmf-lexer'
import { DMFParser } from './DMF/dmf-parser'
import { InterfaceDescriptor } from './descriptors/interface-descriptor'

// import { ControlFactory, MainControl } from './controls'

// Load DMF
async function loadDMF(): Promise<string> {
  const response = await fetch('src/assets/TestInterface.dmf')
  return await response.text()
}

// Load JSONs
async function loadAppearances(): Promise<any[]> {
  const response = await fetch('src/assets/appearances.json')
  return await response.json()
}

async function loadEntities(): Promise<any[]> {
  const response = await fetch('src/assets/entities.json')
  return await response.json()
}

async function loadMap(): Promise<any> {
  const response = await fetch('src/assets/tileids.json')
  return await response.json()
}

async function loadResources(): Promise<any> {
  const response = await fetch('src/assets/resources.json')
  return await response.json()
}

// Parse DMF and create HTML interface
function createInterface(interfaceDesc: InterfaceDescriptor): void {
  const app = document.querySelector<HTMLDivElement>('#app')!
  app.innerHTML = ''
}

async function main() {
  try {
    const dmfSource = await loadDMF()
    const lexer = new DMFLexer(dmfSource)
    const parser = new DMFParser(lexer)
    const interfaceDesc = parser.Interface()

    if (parser.Errors.length > 0) {
      console.error('DMF parsing errors:', parser.Errors)
    }
    console.dir(parser)
    console.dir(interfaceDesc)


    // createInterface(interfaceDesc)

    // // Load JSONs
    // const appearances = await loadAppearances()
    // const entities = await loadEntities()
    // const map = await loadMap()
    // const resources = await loadResources()

    // console.log('Loaded data:', { appearances, entities, map, resources })
  } catch (error) {
    console.error('Error:', error)
  }
}

main()

