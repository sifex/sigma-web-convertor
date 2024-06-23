<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { refDebounced } from '@vueuse/core'
import AccountSwitcher from './AccountSwitcher.vue'
import SigmaFileList from './SigmaFileList.vue'
import SigmaFileDisplay from './SigmaFileDisplay.vue'
import Nav from './Nav.vue'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

interface SigmaFile {
    id: string
    name: string
    content: string
    date: Date
}

// Mock data (replace with actual data management later)
const accounts = [
    {
        label: 'Sigma Converter',
        email: 'converter@sigma.com',
        icon: 'lucide:code',
    },
]

const sigmaFiles = ref<SigmaFile[]>([
    {
        id: '1',
        name: 'AWS Root Credentials',
        content: 'title: AWS Root Credentials\ndescription: Detects AWS root account usage\nlogsource:\n  product: aws\n  service: cloudtrail\ndetection:\n  selection:\n    userIdentity.type: Root\n  filter:\n    eventType: AwsServiceEvent\n  condition: selection and not filter\nfalsepositives:\n  - AWS Tasks That Require Root User Credentials\nlevel: medium',
        date: new Date('2024-06-23T10:00:00'),
    },
    // Add more mock files as needed
])

const isCollapsed = ref(false)
const selectedFile = ref<string | undefined>(sigmaFiles.value[0].id)
const searchValue = ref('')
const debouncedSearch = refDebounced(searchValue, 250)

const filteredFileList = computed(() => {
    const searchValue = debouncedSearch.value?.trim().toLowerCase()
    if (!searchValue) return sigmaFiles.value
    return sigmaFiles.value.filter(file =>
        file.name.toLowerCase().includes(searchValue) ||
        file.content.toLowerCase().includes(searchValue)
    )
})

const selectedFileData = computed(() => sigmaFiles.value.find(file => file.id === selectedFile.value))

const links = [
    {
        title: 'Files',
        label: sigmaFiles.value.length.toString(),
        icon: 'lucide:file',
        variant: 'default',
    },
    {
        title: 'Converted',
        label: '0',
        icon: 'lucide:check',
        variant: 'ghost',
    },
    // Add more navigation items as needed
]

function onCollapse(collapsed: boolean) {
    isCollapsed.value = collapsed
}
</script>

<template>
    <TooltipProvider :delay-duration="0">
        <ResizablePanelGroup direction="horizontal" class="h-dvh items-stretch">
            <ResizablePanel
                :default-size="265"
                :collapsed-size="4"
                :min-size="4"
                :collapsible="true"
                class="bg-muted"
                @collapse="onCollapse"
            >
                <div :class="cn('flex h-[52px] items-center justify-center', isCollapsed ? 'h-[52px]' : 'px-2')">
                    <AccountSwitcher :is-collapsed="isCollapsed" :accounts="accounts" />
                </div>
                <Separator />
                <Nav :is-collapsed="isCollapsed" :links="links" />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel :default-size="440" :min-size="30">
                <Tabs default-value="all" class="h-full">
                    <div class="flex items-center px-4 py-2">
                        <h1 class="text-xl font-bold">Sigma Files</h1>
                        <TabsList class="ml-auto">
                            <TabsTrigger value="all" class="text-zinc-600 dark:text-zinc-200">All files</TabsTrigger>
                            <TabsTrigger value="converted" class="text-zinc-600 dark:text-zinc-200">Converted</TabsTrigger>
                        </TabsList>
                    </div>
                    <Separator />
                    <div class="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <form>
                            <div class="relative">
                                <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input v-model="searchValue" placeholder="Search" class="pl-8" />
                            </div>
                        </form>
                    </div>
                    <TabsContent value="all" class="m-0">
                        <SigmaFileList v-model:selected-file="selectedFile" :items="filteredFileList" />
                    </TabsContent>
                    <TabsContent value="converted" class="m-0">
                        <SigmaFileList v-model:selected-file="selectedFile" :items="[]" />
                    </TabsContent>
                </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel :default-size="655">
                <SigmaFileDisplay :file="selectedFileData" />
            </ResizablePanel>
        </ResizablePanelGroup>
    </TooltipProvider>
</template>