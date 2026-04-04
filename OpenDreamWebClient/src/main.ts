import './style.css'
import { DreamWebInterfaceManager } from './dream-interface-manager'
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


async function main() {
  try {
    const dmfSource = await loadDMF()
    const interfaceManager = new DreamWebInterfaceManager()
    interfaceManager.LoadInterfaceFromSource(dmfSource)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()

