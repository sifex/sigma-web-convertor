import {sigmaTargets} from '../constants';
import {loadPyodide} from "pyodide";

let pyodide: any;
let micropip: any;

export async function loadPyodideAndBackends(backends: string[] = []): Promise<any> {
    try {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/"
        });

        await pyodide.loadPackage("micropip");
        micropip = pyodide.pyimport("micropip");

        await micropip.install('https://files.pythonhosted.org/packages/34/cc/9a1aef6c255a4bc56f1d6534b4ca8b4a93db1206cac140520207a23d0afd/sigma_cli-1.0.5-py3-none-any.whl');

        for (const backend of backends) {
            console.log('Installing backend:', backend);
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