<script setup lang="ts">
import {onMounted, ref} from "vue";
const initial_sigma_rule = ref('')
const output = ref('')
const target = ref('splunk')

const mapping = {
    splunk: 'pysigma-backend-splunk',
    elasticsearch: 'pysigma-backend-elasticsearch'
}

let pyodide: any;
let micropip: any;

onMounted(async () => {
    initial_sigma_rule.value = await fetch('https://raw.githubusercontent.com/SigmaHQ/sigma/master/rules/windows/file/file_event/file_event_win_access_susp_unattend_xml.yml').then(res => res.text())
})

async function lockAndLoad() {
    try {
        pyodide = await loadPyodide();
        await pyodide.loadPackage("micropip");
        micropip = pyodide.pyimport("micropip");
        // await micropip.install('snowballstemmer');

        await micropip.install('https://files.pythonhosted.org/packages/63/9b/4eb29054ab14e4670e5b3cd32bde77de60668034ee32b28b015941ca7966/sigma_cli-0.7.6-py3-none-any.whl')

        await micropip.install(mapping[target.value])
    } catch (e) {
        // console.error(e)
    }
}

onMounted(async () => {
    await lockAndLoad()
    console.log('loaded')
    convert()
})

async function switch_targets() {
    await micropip.install(mapping[target.value])
    await pyodide.loadPackage(mapping[target.value])
    convert()
}


function convert() {
    pyodide.FS.writeFile("/sigma_rule.yml", initial_sigma_rule.value, { encoding: "utf8" });

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
_call_click_command (convert, input=[pathlib.Path('/sigma_rule.yml')], target='` + target.value + `', pipeline=[], without_pipeline=True, pipeline_check=False, format='default', file_pattern='*.yml', skip_unsupported=False, output=open('/output.txt', 'wb+'), encoding='utf-8', json_indent=0, backend_option=[])

        `);

    output.value = pyodide.FS.readFile("/output.txt", { encoding: "utf8" })
}
</script>

<template>
  <div class="p-10 flex flex-col justify-center items-center h-full w-full gap-4">
      <div>
        <textarea @input="convert" v-model="initial_sigma_rule" class="p-2 rounded border-0 outline-0" name="" id="" cols="70" rows="32"></textarea>
      </div>
      <div class="w-full">
<!--          <button @click="convert" class="bg-emerald-600 block rounded text-white bold min-w-full py-1.5">Submit</button>-->
          <select @change="switch_targets" v-model="target" name="" id="">
            <option value="splunk">Splunk</option>
            <option value="elasticsearch">Elastic</option>
          </select>
      </div>
      <div>
          <textarea v-model="output" class="p-2 rounded border-0 outline-0" name="" id="" cols="70" rows="10"></textarea>
      </div>
  </div>
</template>
