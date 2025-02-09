import { loadPyodide } from "pyodide";
import { sigmaTargets } from '../constants';

let pyodide = null;
let installedBackends = new Set();

let pyodideReadyPromise = (async () => {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/"
    });

    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // Install sigma-cli
    await micropip.install('https://files.pythonhosted.org/packages/34/cc/9a1aef6c255a4bc56f1d6534b4ca8b4a93db1206cac140520207a23d0afd/sigma_cli-1.0.5-py3-none-any.whl');

    return pyodide;
})();

async function installBackend(target) {
    if (installedBackends.has(target)) {
        return { success: true };
    }

    const targetInfo = sigmaTargets.get(target);
    if (!targetInfo?.backendUrl) {
        throw new Error(`No backend URL found for target ${target}`);
    }

    const micropip = pyodide.pyimport("micropip");
    await micropip.install(targetInfo.backendUrl);
    installedBackends.add(target);
    return { success: true };
}

async function convertRule(rule, target) {
    if (!installedBackends.has(target)) {
        await installBackend(target);
    }

    pyodide.FS.writeFile("/sigma_rule.yml", rule, { encoding: "utf8" });

    pyodide.runPython(`
      import importlib
      from sigma.cli.convert import convert
      import click
      import pathlib
      
      class fakemodule(object):
          pass
      
      import sys
      sys.modules["tty"] = fakemodule
      sys.modules["termios"] = fakemodule
      
      def _call_click_command(cmd: click.Command, *args, **kwargs):
          return cmd.callback(*args, **kwargs)
      
      importlib.invalidate_caches()
      
      _call_click_command(
          convert,
          input=[pathlib.Path('/sigma_rule.yml')],
          target='${target}',
          pipeline=[],
          without_pipeline=True,
          pipeline_check=False,
          format='default',
          file_pattern='*.yml',
          correlation_method=None,
          skip_unsupported=False,
          output=open('/output.txt', 'wb+'),
          encoding='utf-8',
          json_indent=0,
          backend_option=[],
          filter=[],
          verbose=False
      )
    `);

    return { result: pyodide.FS.readFile("/output.txt", { encoding: "utf8" }) };
}

self.onmessage = async (event) => {
    const { id, type, rule, target } = event.data;

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
                response = { ready: true };
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        self.postMessage({ ...response, id });
    } catch (error) {
        self.postMessage({ error: error.message, id });
    }
};
