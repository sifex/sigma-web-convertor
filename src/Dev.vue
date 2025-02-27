<script lang="ts" setup>

import {sigmaTargets} from "@/constants.ts";
import {Level, LogsourceData, SigmaRule, Status} from "@/utils/SigmaRule.ts";
import {logsources} from "@/data/logsources.ts";
import {PrismEditor} from "vue-prism-editor";
import {Clipboard, Eye} from "lucide-vue-next";
import {
    TagsInput,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemDelete,
    TagsInputItemText
} from "@/components/ui/tags-input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Separator} from "@/components/ui/separator";
import {Label} from "@/components/ui/label";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {computed, onMounted, reactive, ref, watch} from "vue";
import {convertSigmaRuleAsync, installBackendAsync, isPyodideReadyAsync} from "@/utils/workerApi.ts";

const yamlSource = ref('')
const target = ref('splunk')
const conversionResult = reactive({
    result: '',
    error: ''
})


async function convertFile() {
    try {
        const result: { result: any, error: any } = await convertSigmaRuleAsync(yamlSource.value, target.value)
        conversionResult.result = result.result
        conversionResult.error = result.error

    } catch (error) {
        console.error('Error during conversion:', error)
        conversionResult.error = `Error: Failed to convert Sigma rule. ${error}`
    }
}

watch(yamlSource, () => {
    convertFile()
})

onMounted(async () => {
    await installBackendAsync('splunk')
})
</script>

<template>
    {{ conversionResult }}
    <div class="flex-1 p-4">
        <Label for="yamlSource">YAML Source</Label>
        <Textarea class="language-yaml" v-model="yamlSource" />
    </div>
    <Separator />
    <div class="p-4">
        <Label for="conversionResult">Conversion Result</Label>

        <Textarea id="conversionResult" v-model="conversionResult.result"
                  class="min-h-[200px] p-4 font-mono w-full" placeholder="Conversion result will appear here..."
                  readonly />
        <span>
            <span v-if="conversionResult.error" class="text-red-500">{{ conversionResult.error }}</span>
        </span>
    </div>
    <Button class="w-full" @click="convertFile">Convert</Button>
</template>