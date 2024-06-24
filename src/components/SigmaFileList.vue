<script lang="ts" setup>
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SigmaFile {
    id: string
    name: string
    content: string
    date: Date
}

interface SigmaFileListProps {
    items: SigmaFile[]
}

defineProps<SigmaFileListProps>()
const selectedFile = defineModel<string>('selectedFile', { required: false })
</script>

<template>
    <ScrollArea class="h-screen">
        <div class="flex flex-col gap-2 p-4 pt-0">
            <button
                v-for="item in items"
                :key="item.id"
                :class="cn(
          'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
          selectedFile === item.id && 'bg-muted',
        )"
                @click="selectedFile = item.id"
            >
                <div class="flex w-full flex-col gap-1">
                    <div class="flex items-center">
                        <div class="font-semibold">{{ item.name }}</div>
                        <div class="ml-auto text-xs text-muted-foreground">
                            {{ formatDistanceToNow(new Date(item.date), { addSuffix: true }) }}
                        </div>
                    </div>
                </div>
                <div class="line-clamp-2 text-xs text-muted-foreground">
                    {{ item.content.substring(0, 300) }}
                </div>
            </button>
            <button
                :class="cn(
          'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
        )"
            >
                <div class="flex w-full flex-col gap-1">
                    <div class="flex items-center">
                        <div class="font-semibold">asdf</div>
                        <div class="ml-auto text-xs text-muted-foreground">
                            asdf
                        </div>
                    </div>
                </div>
                <div class="line-clamp-2 text-xs text-muted-foreground">
asdasdf
                </div>
            </button>
        </div>
    </ScrollArea>
</template>