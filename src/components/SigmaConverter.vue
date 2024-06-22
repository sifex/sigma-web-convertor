<template>
    <div class="flex w-full justify-center items-center min-h-screen bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6">
        <div class="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div class="p-6 space-y-6">
                <h2 class="text-2xl font-bold text-gray-100">Sigma Rule Converter</h2>
                <div class="space-y-4">
                    <div class="relative">
            <textarea
                v-model="initialSigmaRule"
                @input="convert"
                :disabled="isLoading"
                class="w-full h-64 bg-gray-700 text-gray-100 rounded-md border border-gray-600 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter your Sigma rule here..."
            ></textarea>
                        <div class="absolute top-2 right-2 bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs">aws_root_account_usage.yml</div>
                    </div>
                    <div class="flex space-x-4">
                        <select
                            v-model="target"
                            @change="switchTargets"
                            :disabled="isLoading"
                            class="flex-grow bg-gray-700 text-gray-100 rounded-md border border-gray-600 p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option v-for="[key, value] in sigmaTargets" :key="key" :value="key">
                                {{ value.title }}
                            </option>
                        </select>
                        <button
                            @click="convert"
                            :disabled="isLoading"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out"
                        >
                            Convert
                        </button>
                    </div>
                    <div class="relative">
            <textarea
                v-model="output"
                class="w-full h-32 bg-gray-700 text-gray-100 rounded-md border border-gray-600 p-3 resize-none"
                readonly
            ></textarea>
                        <div class="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">Output</div>
                    </div>
                </div>
            </div>
            <div v-if="isLoading" class="absolute inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                <div class="text-white text-lg">Loading Pyodide and backends... Please wait.</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { sigmaTargets } from '../constants';
import { loadPyodideAndBackends } from '../utils/pyodideLoader';
import { convertSigmaRule } from '../utils/sigmaUtils';

const initialSigmaRule = ref('');
const output = ref('');
const target = ref('splunk');
const isLoading = ref(true);

onMounted(async () => {
    try {
        initialSigmaRule.value = await fetch(
            'https://raw.githubusercontent.com/SigmaHQ/sigma/master/rules/windows/file/file_event/file_event_win_access_susp_unattend_xml.yml'
        ).then(res => res.text());

        await loadPyodideAndBackends([target.value]);
        isLoading.value = false;
        convert();
    } catch (error) {
        console.error('Error during initialization:', error);
        output.value = `Error: Failed to initialize. ${error.message}`;
        isLoading.value = false;
    }
});

async function switchTargets() {
    try {
        isLoading.value = true;
        output.value = 'Loading new backend...';
        await loadPyodideAndBackends([target.value]);
        isLoading.value = false;
        convert();
    } catch (error) {
        console.error('Error installing backend:', error);
        output.value = `Error: Failed to install backend for ${sigmaTargets.get(target.value)?.title}. ${error.message}`;
        isLoading.value = false;
    }
}

function convert() {
    if (!isLoading.value) {
        try {
            output.value = convertSigmaRule(initialSigmaRule.value, target.value);
        } catch (error) {
            console.error('Error during conversion:', error);
            output.value = `Error: Failed to convert Sigma rule. ${error.message}`;
        }
    }
}
</script>