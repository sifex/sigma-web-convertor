<script setup lang="ts">
import MonacoYamlEditor from '../src/components/Editor.vue';
import {ref} from "vue";

const test = ref('Hello World')
</script>

<template>
    {{ test }}
    <MonacoYamlEditor v-model="test" class="!h-screen w-full"/>
</template>