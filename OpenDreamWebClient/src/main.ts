import './style.css'
import { DreamWebInterfaceManager } from './dream-interface-manager'

// Load DMF
async function loadDMF(): Promise<string> {
  const response = await fetch('src/assets/TestInterface.dmf')
  return await response.text()
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

