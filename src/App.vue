<script lang="ts" setup>
import {onMounted, ref} from "vue";

const initial_sigma_rule = ref('')
const output = ref('')
const target = ref('lucene')

interface SigmaTarget {
    title: string;
    backend: string;
    backendUrl: string;
}

const mapping: Map<string, SigmaTarget> = new Map([
    ['splunk', {
        title: 'Splunk',
        backend: 'pysigma-backend-splunk',
        backendUrl: 'https://files.pythonhosted.org/packages/40/01/217201109a076c65016162263fbe1701c89906b574ba5ade6364c5b87e2e/pysigma_backend_splunk-1.1.0-py3-none-any.whl'
    }],
    ['lucene', {
        title: 'Lucene',
        backend: 'pysigma-backend-elasticsearch',
        backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
    }],
    ['eql', {
        title: 'EQL',
        backend: 'pysigma-backend-elasticsearch',
        backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
    }],
    ['esql', {
        title: 'ES|QL',
        backend: 'pysigma-backend-elasticsearch',
        backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
    }]
]);

let pyodide: any;
let micropip: any;

onMounted(async () => {
    initial_sigma_rule.value = await fetch(
        'https://raw.githubusercontent.com/SigmaHQ/sigma/master/rules/windows/file/file_event/file_event_win_access_susp_unattend_xml.yml'
    ).then(res => res.text())
})

async function lockAndLoad(backends: Array<string> = []) {
    try {
        pyodide = await loadPyodide({
            indexURL : "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
        });
        await pyodide.loadPackage("micropip");
        micropip = pyodide.pyimport("micropip");

        await micropip.install('https://files.pythonhosted.org/packages/5e/6f/c1b850a092861e3f8a6cb995933d01966b5f441b6da6eb1414452e33c238/sigma_cli-1.0.2-py3-none-any.whl')

        for (const backend of backends) {
            const targetInfo = mapping.get(backend);

            if (targetInfo) {
                await micropip.install(targetInfo.backendUrl);
            }
        }
    } catch (e) {
        console.error(e)
    }
}

onMounted(async () => {
    await lockAndLoad(
        [
            target.value
        ]
    )
    console.log('loaded')
    convert()
})

async function switch_targets() {
    const targetInfo = mapping.get(target.value);
    if (targetInfo) {
        try {
            await lockAndLoad([target.value])
            convert();
        } catch (error) {
            console.error('Error installing backend:', error);
            output.value = `Error: Failed to install backend for ${targetInfo.title}. ${error.message}`;
        }
    }
}

function convert() {
    pyodide.FS.writeFile("/sigma_rule.yml", initial_sigma_rule.value, {encoding: "utf8"});

    pyodide.runPython(`
import importlib
from sigma.cli.list  import list_pipelines
from sigma.cli.convert import convert
from functools import partial
from inspect import getmembers
import pathlib
import click

class fakemodule(object):
    pass

import sys
sys.modules["tty"] = fakemodule
sys.modules["termios"] = fakemodule

all_functions_of_click_commands = {}

def _call_click_command(cmd: click.Command, *args, **kwargs):
    result = cmd.callback(*args, **kwargs)
    return result

importlib.invalidate_caches() # Make sure Python notices the new .py file

# _call_click_command(convert)
# _call_click_command(list_pipelines, 'splunk')
_call_click_command (convert, input=[pathlib.Path('/sigma_rule.yml')], target='` + target.value + `', pipeline=[], without_pipeline=True, pipeline_check=False, format='default', file_pattern='*.yml', correlation_method=None, skip_unsupported=False, output=open('/output.txt', 'wb+'), encoding='utf-8', json_indent=0, backend_option=[])

        `);

    output.value = pyodide.FS.readFile("/output.txt", {encoding: "utf8"})
}
</script>

<template>
    <div class="p-10 flex flex-col justify-center items-center h-full w-full gap-4">
        <div>
            <textarea id="" v-model="initial_sigma_rule" class="p-2 rounded border-0 outline-0" cols="70" name=""
                      rows="32" @input="convert"></textarea>
        </div>
        <div class="w-full">
            <select id="" v-model="target" name="" @change="switch_targets">
                <option v-for="[key, value] in mapping" :key="key" :value="key">
                    {{ value.title }}
                </option>
            </select>
        </div>
        <div>
            <textarea id="" v-model="output" class="p-2 rounded border-0 outline-0" cols="70" name=""
                      rows="10"></textarea>
        </div>
    </div>
</template>
