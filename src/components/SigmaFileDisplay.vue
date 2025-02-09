<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Clipboard, Eye } from 'lucide-vue-next'
import Prism from 'prismjs'
import 'prismjs/components/prism-yaml'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemDelete,
    TagsInputItemText
} from '@/components/ui/tags-input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { convertSigmaRuleAsync, installBackendAsync, isPyodideReadyAsync } from '../utils/workerApi.ts'
import { sigmaTargets } from '../constants'
import { logsources, Logsource } from '../data/logsources'
import { SigmaRule, LogsourceData, Status, Level } from '../utils/SigmaRule'
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css";

interface SigmaFile {
    id: string
    name: string
    content: string
    date: Date
}

interface SigmaFileDisplayProps {
    file: SigmaFile | undefined
}

const props = defineProps<SigmaFileDisplayProps>()

const sigmaRule = ref(new SigmaRule())
const showYamlSource = ref(false)
const conversionResult = ref('')
const target = ref('splunk')
const isLoading = ref(true)
const isPyodideReady = ref(false)

const yamlSource = computed(() => sigmaRule.value.generateYaml())
const detectionYaml = computed({
    get: () => sigmaRule.value.getDetectionYaml(),
    set: (value) => {
        sigmaRule.value.setDetectionFromYaml(value)
        convertFile()
    }
})

const highlightedYaml = computed(() => {
    return Prism.highlight(yamlSource.value, Prism.languages.yaml, 'yaml')
})

function highlighter(code: string) {
    return Prism.highlight(code, Prism.languages.yaml, 'yaml')
}

function updateSigmaRule(field: string, value: any) {
    sigmaRule.value.setData({ [field]: value })
    if (field === 'logsource') {
        convertFile()
    }
}

async function initializeSigmaRule() {
    if (props.file) {
        sigmaRule.value = new SigmaRule(props.file.content)
        await convertFile()
    }
}

async function switchTargets() {
    try {
        isLoading.value = true
        conversionResult.value = 'Loading new backend...'
        console.log('Switching to target:', target.value)
        await installBackendAsync(target.value)
        isLoading.value = false
        await convertFile()
    } catch (error) {
        console.error('Error installing backend:', error)
        conversionResult.value = `Error: Failed to install backend for ${sigmaTargets.get(target.value)?.title}. ${error}`
        isLoading.value = false
    }
}

async function convertFile() {
    if (!isLoading.value && isPyodideReady.value) {
        try {
            conversionResult.value = await convertSigmaRuleAsync(yamlSource.value, target.value)
        } catch (error) {
            console.error('Error during conversion:', error)
            conversionResult.value = `Error: Failed to convert Sigma rule. ${error}`
        }
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(yamlSource.value)
        .then(() => {
            // You might want to show a success message here
        })
        .catch(err => {
            console.error('Failed to copy text: ', err)
        })
}

function toggleViewSource() {
    showYamlSource.value = !showYamlSource.value
}

function getLogsourceDescription(logsource: LogsourceData): string {
    const matchingLogsource = logsources.find(ls =>
        ls.category === logsource.category &&
        ls.product === logsource.product &&
        ls.service === logsource.service
    )
    return matchingLogsource ? matchingLogsource.description : 'Custom Logsource'
}

watch(() => props.file, async (newFile) => {
    if (newFile) {
        await initializeSigmaRule()
    }
})

watch(() => sigmaRule.value.getData().logsource, () => {
    convertFile()
}, { deep: true })

watch(() => sigmaRule.value.getData().detection, () => {
    convertFile()
}, { deep: true })

onMounted(async () => {
    try {
        const { ready } = await isPyodideReadyAsync()
        isPyodideReady.value = ready
        isLoading.value = false
        if (ready) {
            await switchTargets()
            await initializeSigmaRule()
        }
    } catch (error) {
        console.error('Error initializing:', error)
        conversionResult.value = `Error: Failed to initialize. ${error}`
        isLoading.value = false
    }
})
</script>

<template>
    <ScrollArea class="h-full">
        <div class="flex flex-col p-4 space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button :disabled="!file || isLoading" size="icon" variant="ghost" @click="copyToClipboard">
                                <Clipboard class="h-4 w-4" />
                                <span class="sr-only">Copy to Clipboard</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy to Clipboard</TooltipContent>
                    </Tooltip>
                    <Button :variant="showYamlSource ? 'default' : 'outline'" @click="toggleViewSource">
                        <Eye class="h-4 w-4 mr-2" />
                        {{ showYamlSource ? 'Edit Fields' : 'View YAML Source' }}
                    </Button>
                </div>
                <div class="flex items-center gap-2">
                    <Select v-model="target" :disabled="isLoading" @update:modelValue="switchTargets">
                        <SelectTrigger class="w-[180px]">
                            <SelectValue placeholder="Select a target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="[key, value] in sigmaTargets" :key="key" :value="key">
                                {{ value.title }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Separator />
            <div v-if="file">
                <div v-if="!showYamlSource" class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="title">Title</Label>
                        <Input id="title" v-model="sigmaRule.getData().title" :disabled="isLoading"
                            @input="updateSigmaRule('title', $event.target.value)" />
                    </div>
                    <div class="space-y-2">
                        <Label for="description">Description</Label>
                        <Textarea id="description" v-model="sigmaRule.getData().description" :disabled="isLoading"
                            @input="updateSigmaRule('description', $event.target.value)" />
                    </div>
                    <div class="space-y-2">
                        <Label for="status">Status</Label>
                        <Select :disabled="isLoading" :value="sigmaRule.getData().status"
                            @update:modelValue="value => updateSigmaRule('status', value)">
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="status in Object.values(Status)" :key="status" :value="status">
                                    {{ status }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label for="author">Author</Label>
                        <Input id="author" v-model="sigmaRule.getData().author" :disabled="isLoading"
                            @input="updateSigmaRule('author', $event.target.value)" />
                    </div>
                    <div class="space-y-2">
                        <Label for="references">References</Label>
                        <TagsInput :disabled="isLoading" :model-value="sigmaRule.getData().references"
                            @update:modelValue="value => updateSigmaRule('references', value)">
                            <TagsInputItem v-for="item in sigmaRule.getData().references" :key="item" :value="item">
                                <TagsInputItemText />
                                <TagsInputItemDelete />
                            </TagsInputItem>
                            <TagsInputInput placeholder="Add reference..." />
                        </TagsInput>
                    </div>
                    <div class="space-y-2">
                        <Label for="tags">Tags</Label>
                        <TagsInput :disabled="isLoading" :model-value="sigmaRule.getData().tags"
                            @update:modelValue="value => updateSigmaRule('tags', value)">
                            <TagsInputItem v-for="item in sigmaRule.getData().tags" :key="item" :value="item">
                                <TagsInputItemText />
                                <TagsInputItemDelete />
                            </TagsInputItem>
                            <TagsInputInput placeholder="Add tag..." />
                        </TagsInput>
                    </div>
                    <div class="space-y-2">
                        <Label for="logsource">Logsource</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button :disabled="isLoading" variant="outline">
                                    {{ getLogsourceDescription(sigmaRule.getData().logsource) || 'Select Logsource' }}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-56">
                                <DropdownMenuItem v-for="source in logsources" :key="source.description"
                                    @click="sigmaRule.setLogsource(source)">
                                    {{ source.description }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div class="space-y-2">
                        <Label for="level">Level</Label>
                        <Select :disabled="isLoading" :value="sigmaRule.getData().level"
                            @update:modelValue="value => updateSigmaRule('level', value)">
                            <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="level in Object.values(Level)" :key="level" :value="level">
                                    {{ level }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="col-span-2 space-y-2">
                        <Label for="detection">Detection</Label>
                        <PrismEditor id="detection" v-model="detectionYaml" :disabled="isLoading"
                            :highlight="highlighter" class="min-h-[300px] flex-1 p-4 font-mono w-full" line-numbers
                            placeholder="Enter detection YAML here..." />
                    </div>
                </div>
                <div v-else class="flex-1 p-4">
                    <Label for="yamlSource">YAML Source</Label>
                    <pre><code class="language-yaml" v-html="highlightedYaml"></code></pre>
                </div>
                <Separator />
                <div class="p-4">
                    <Label for="conversionResult">Conversion Result</Label>

                    <Textarea id="conversionResult" v-model="conversionResult.result"
                        class="min-h-[200px] p-4 font-mono w-full" placeholder="Conversion result will appear here..."
                        readonly />
                </div>
            </div>
            <div v-else class="p-8 text-center text-muted-foreground">
                No file selected
            </div>
            <div v-if="isLoading" class="absolute inset-0 flex justify-center items-center bg-background/80">
                <div class="text-foreground">Loading Pyodide and backends... Please wait.</div>
            </div>
        </div>
    </ScrollArea>
</template>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css';

/* required class */
#detection {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    background: rgba(0, 0, 0, 0.3);
    /* you can use rgba, hex, hsl, etc */
    color: #ccc;
    border-radius: 5px;

    /* you must provide font-family font-size line-height. Example: */
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
    margin-bottom: 2rem;
}
</style>