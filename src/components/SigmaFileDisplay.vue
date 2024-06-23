<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue'
import { Clipboard, Eye } from 'lucide-vue-next'
import Prism from 'prismjs/prism'
import 'prismjs/components/prism-yaml'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText } from '@/components/ui/tags-input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { convertSigmaRule } from '../utils/sigmaUtils'
import { sigmaTargets } from '../constants'
import { loadPyodideAndBackends } from '../utils/pyodideLoader'
import { logsources, Logsource } from '../data/logsources'
import { SigmaRule, LogsourceData } from '../utils/SigmaRule'

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
const yamlSource = ref('')
const showYamlSource = ref(false)
const conversionResult = ref('')
const target = ref('splunk')
const isLoading = ref(true)
const isPyodideReady = ref(false)

const statusOptions = ['experimental', 'test', 'stable', 'deprecated', 'unsupported']
const levelOptions = ['informational', 'low', 'medium', 'high', 'critical']

const highlightedYaml = computed(() => {
    return Prism.highlight(yamlSource.value, Prism.languages.yaml, 'yaml')
})

const detectionYaml = computed({
    get: () => sigmaRule.value.getDetectionYaml(),
    set: (value: string) => sigmaRule.value.setDetectionFromYaml(value)
})
const detectionTextarea = ref<HTMLTextAreaElement | null>(null)
const highlightedDetection = computed(() => {
    return Prism.highlight(detectionYaml.value, Prism.languages.yaml, 'yaml')
})

function updateDetectionHighlight() {
    if (detectionTextarea.value) {
        detectionTextarea.value.style.height = 'auto'
        detectionTextarea.value.style.height = `${detectionTextarea.value.scrollHeight}px`
    }
}

watch(detectionYaml, updateDetectionHighlight, { immediate: true })

onMounted(async () => {
    try {
        await loadPyodideAndBackends([target.value])
        isPyodideReady.value = true
        isLoading.value = false
        if (props.file) {
            sigmaRule.value = new SigmaRule(props.file.content)
            yamlSource.value = sigmaRule.value.generateYaml()
            await convertFile()
        }
    } catch (error) {
        console.error('Error loading Pyodide:', error)
        conversionResult.value = `Error: Failed to load Pyodide. ${error.message}`
        isLoading.value = false
    }
})

watch(() => props.file, (newFile) => {
    if (newFile) {
        sigmaRule.value = new SigmaRule(newFile.content)
        yamlSource.value = sigmaRule.value.generateYaml()
        if (isPyodideReady.value) {
            convertFile()
        }
    }
}, { immediate: true })

watch(() => sigmaRule.value.getData(), async () => {
    yamlSource.value = sigmaRule.value.generateYaml()
    if (isPyodideReady.value) {
        await convertFile()
    }
}, { deep: true })

watch(target, async () => {
    if (isPyodideReady.value) {
        await switchTargets()
    }
})

async function switchTargets() {
    try {
        isLoading.value = true
        conversionResult.value = 'Loading new backend...'
        await loadPyodideAndBackends([target.value])
        isLoading.value = false
        await convertFile()
    } catch (error) {
        console.error('Error installing backend:', error)
        conversionResult.value = `Error: Failed to install backend for ${sigmaTargets.get(target.value)?.title}. ${error.message}`
        isLoading.value = false
    }
}

async function convertFile() {
    if (!isLoading.value && isPyodideReady.value) {
        try {
            conversionResult.value = await convertSigmaRule(yamlSource.value, target.value)
        } catch (error) {
            console.error('Error during conversion:', error)
            conversionResult.value = `Error: Failed to convert Sigma rule. ${error.message}`
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
    );
    return matchingLogsource ? matchingLogsource.description : 'Custom Logsource';
}
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between p-2">
            <div class="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger as-child>
                        <Button variant="ghost" size="icon" :disabled="!file || isLoading" @click="copyToClipboard">
                            <Clipboard class="h-4 w-4" />
                            <span class="sr-only">Copy to Clipboard</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to Clipboard</TooltipContent>
                </Tooltip>
                <Button @click="toggleViewSource" :variant="showYamlSource ? 'default' : 'outline'">
                    <Eye class="h-4 w-4 mr-2" />
                    {{ showYamlSource ? 'Edit Fields' : 'View YAML Source' }}
                </Button>
            </div>
            <div class="flex items-center gap-2">
                <Select v-model="target" :disabled="isLoading">
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
        <div v-if="file" class="flex flex-1 flex-col">
            <div v-if="!showYamlSource" class="grid grid-cols-2 gap-4 p-4">
                <div class="space-y-2">
                    <Label for="title">Title</Label>
                    <Input id="title" v-model="sigmaRule.getData().title" :disabled="isLoading" />
                </div>
                <div class="space-y-2">
                    <Label for="description">Description</Label>
                    <Textarea id="description" v-model="sigmaRule.getData().description" :disabled="isLoading" />
                </div>
                <div class="space-y-2">
                    <Label for="status">Status</Label>
                    <Select v-model="sigmaRule.getData().status" :disabled="isLoading">
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="option in statusOptions" :key="option" :value="option">
                                {{ option }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label for="author">Author</Label>
                    <Input id="author" v-model="sigmaRule.getData().author" :disabled="isLoading" />
                </div>
                <div class="space-y-2">
                    <Label for="references">References</Label>
                    <TagsInput v-model="sigmaRule.getData().references" :disabled="isLoading">
                        <TagsInputItem v-for="item in sigmaRule.getData().references" :key="item" :value="item">
                            <TagsInputItemText />
                            <TagsInputItemDelete />
                        </TagsInputItem>
                        <TagsInputInput placeholder="Add reference..." />
                    </TagsInput>
                </div>
                <div class="space-y-2">
                    <Label for="tags">Tags</Label>
                    <TagsInput v-model="sigmaRule.getData().tags" :disabled="isLoading">
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
                            <Button variant="outline" :disabled="isLoading">
                                {{ getLogsourceDescription(sigmaRule.getData().logsource) || 'Select Logsource' }}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-56">
                            <DropdownMenuItem v-for="source in logsources" :key="source.description" @click="sigmaRule.setLogsource(source)">
                                {{ source.description }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div class="space-y-2">
                    <Label for="level">Level</Label>
                    <Select v-model="sigmaRule.getData().level" :disabled="isLoading">
                        <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="option in levelOptions" :key="option" :value="option">
                                {{ option }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="col-span-2 space-y-2">
                    <Label for="detection">Detection</Label>
                    <Textarea
                        id="detection"
                        v-model="detectionYaml"
                        class="min-h-[300px] flex-1 p-4 font-mono w-full"
                        placeholder="Enter detection YAML here..."
                        :disabled="isLoading"
                    />
                </div>
            </div>
            <div v-else class="flex-1 p-4">
                <Label for="yamlSource">YAML Source</Label>
                <pre><code v-html="highlightedYaml" class="language-yaml"></code></pre>
            </div>
            <Separator />
            <div class="p-4">
                <Label for="conversionResult">Conversion Result</Label>
                <Textarea
                    id="conversionResult"
                    v-model="conversionResult"
                    class="min-h-[200px] p-4 font-mono w-full"
                    placeholder="Conversion result will appear here..."
                    readonly
                />
            </div>
        </div>
        <div v-else class="p-8 text-center text-muted-foreground">
            No file selected
        </div>
        <div v-if="isLoading" class="absolute inset-0 flex justify-center items-center bg-background/80">
            <div class="text-foreground">Loading Pyodide and backends... Please wait.</div>
        </div>
    </div>
</template>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css';
</style>