import { getPyodide } from './pyodideLoader.ts';

export function convertSigmaRule(rule: string, target: string): string {
  const pyodide = getPyodide();
  
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
        backend_option=[]
    )
  `);

  return pyodide.FS.readFile("/output.txt", { encoding: "utf8" });
}
