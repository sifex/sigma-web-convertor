<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';

const props = defineProps<{
    modelValue: string
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>();

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const code = ref(props.modelValue);

const predefinedKeys = [
    'name',
    'version',
    'description',
    'dependencies',
    'devDependencies',
    'scripts',
];

const MONACO_EDITOR_OPTIONS = {
    automaticLayout: true,
    formatOnType: true,
    formatOnPaste: true,
};

const setupYamlLanguage = () => {
    monaco.languages.register({ id: 'yaml' });

    monaco.languages.setLanguageConfiguration('yaml', {
        comments: {
            lineComment: '#',
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ],
        indentationRules: {
            increaseIndentPattern: /^.*:\s*$/,
            decreaseIndentPattern: /^\s*-.*$/,
        },
    });

    monaco.languages.setMonarchTokensProvider('yaml', {
        tokenizer: {
            root: [
                [/^[\t ]*[A-Za-z_\d\-]+(?=\s*:)/, 'type.identifier'],
                [/:\s*/, 'delimiter'],
                [/#.*$/, 'comment'],
                [/[A-Za-z_\d\-]+/, 'identifier'],
                [/".*?"/, 'string'],
                [/'.*?'/, 'string'],
                [/\d+/, 'number'],
            ],
        },
    });
};

const setupYamlAutocomplete = () => {
    monaco.languages.registerCompletionItemProvider('yaml', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = predefinedKeys.map((key) => ({
                label: key,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: key,
                range,
            }));

            return { suggestions };
        },
    });
};

const handleBeforeMount = (monaco: typeof import('monaco-editor')) => {
    setupYamlLanguage();
    setupYamlAutocomplete();
};

const handleMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.value = editor;
};

const handleChange = (value: string | undefined, event: monaco.editor.IModelContentChangedEvent) => {
    if (value !== undefined) {
        emit('update:modelValue', value);
    }
};

</script>

<template>
    <VueMonacoEditor
        v-model:value="code"
        language="yaml"
        theme="vs-dark"
        :options="MONACO_EDITOR_OPTIONS"
        @before-mount="handleBeforeMount"
        @mount="handleMount"
        @change="handleChange"
    >
        <template #default>
            Loading...
        </template>
        <template #failure>
            Failed to load the editor.
        </template>
    </VueMonacoEditor>
</template>
