import {loadPyodide} from "pyodide";
import {sigmaTargets} from '../constants';

let pyodide = null;
let installedBackends = new Set();

let pyodideReadyPromise = (async () => {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.3/full/"
    });

    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // Install sigma-cli
    await micropip.install('https://files.pythonhosted.org/packages/43/60/1431361a1a4afa2e81ecab4b5fb7af08b015dfd4d8b9edf1dd2923d2a8b6/pysigma-0.11.19-py3-none-any.whl');

    return pyodide;
})();

async function installBackend(target) {
    if (installedBackends.has(target)) {
        return {success: true};
    }

    const targetInfo = sigmaTargets.get(target);
    if (!targetInfo?.backendUrl) {
        throw new Error(`No backend URL found for target ${target}`);
    }

    const micropip = pyodide.pyimport("micropip");
    await micropip.install(targetInfo.backendUrl);
    installedBackends.add(target);
    return {success: true};
}

async function convertRule(rule, target) {
    if (!installedBackends.has(target)) {
        await installBackend(target);
    }

    const conversionCode = `
import pathlib
import textwrap
from typing import Sequence

from sigma.collection import SigmaCollection
from sigma.conversion.base import Backend
from sigma.exceptions import (
    SigmaError,
    SigmaPipelineNotAllowedForBackendError,
    SigmaPipelineNotFoundError,
)
from sigma.plugins import InstalledSigmaPlugins
import yaml

plugins = InstalledSigmaPlugins.autodiscover()
backends = plugins.backends
pipelines = plugins.pipelines
pipeline_resolver = plugins.get_pipeline_resolver()
pipeline_list = list(pipeline_resolver.pipelines.keys())

def convert_rule(rule_yaml, target):
    # Parse the rule
    rule_collection = SigmaCollection.from_yaml(rule_yaml)
    
    # Initialize backend
    backend_class = backends[target]
    backend = backend_class()
    
    # Convert rule
    result = backend.convert(rule_collection, "default")
    
    if isinstance(result, str):
        return result
    elif isinstance(result, list):
        return "\\n\\n".join(result) if all(isinstance(x, str) for x in result) else result
    else:
        return str(result)

response = convert_rule(rule_yaml, target)
`;

    const globals = pyodide.toPy({ rule_yaml: rule, target: target });
    pyodide.runPython(conversionCode, { globals });

    return { result: globals.get('response') };
}

self.onmessage = async (event) => {
    const {id, type, rule, target} = event.data;

    try {
        await pyodideReadyPromise;

        let response;
        switch (type) {
            case 'convert':
                response = await convertRule(rule, target);
                break;
            case 'install':
                response = await installBackend(target);
                break;
            case 'status':
                response = {ready: true};
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        self.postMessage({...response, id});
    } catch (error) {
        self.postMessage({error: error.message, id});
    }
};
