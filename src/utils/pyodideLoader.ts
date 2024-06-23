import { sigmaTargets } from '../constants';

let pyodide: any;
let micropip: any;

const TIMEOUT = 30000; // 30 seconds timeout
const RETRY_INTERVAL = 100; // 100ms between retries

async function waitForPyodide(timeout: number = TIMEOUT): Promise<void> {
  const start = Date.now();
  while (!(window as any).loadPyodide) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for Pyodide to load');
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
  }
}

export async function loadPyodideAndBackends(backends: string[] = []): Promise<any> {
  try {
    await waitForPyodide();

    pyodide = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
    });
    await pyodide.loadPackage("micropip");
    micropip = pyodide.pyimport("micropip");

    await micropip.install('https://files.pythonhosted.org/packages/5e/6f/c1b850a092861e3f8a6cb995933d01966b5f441b6da6eb1414452e33c238/sigma_cli-1.0.2-py3-none-any.whl');

    for (const backend of backends) {
      const targetInfo = sigmaTargets.get(backend);
      if (targetInfo) {
        await micropip.install(targetInfo.backendUrl);
      }
    }

    return pyodide;
  } catch (error) {
    console.error('Error loading Pyodide or backends:', error);
    throw error;
  }
}

export function getPyodide() {
  if (!pyodide) {
    throw new Error('Pyodide is not initialized. Call loadPyodideAndBackends first.');
  }
  return pyodide;
}