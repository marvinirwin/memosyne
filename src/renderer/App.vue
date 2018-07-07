<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script>
    import showdown from 'showdown';
    const converter = new showdown.Converter();

    export default {
        name: 'memosyne',
        mounted() {
            document.converter = converter;
        }
    }
</script>

<style>
    /* CSS */
    body {
    }

    .node {
        display: flex;
        margin-top: 2px;
        margin-bottom: 2px;
    }

    .node > .nucleus {
        height: fit-content;
        display: flex;
        flex-flow: column nowrap;
        align-self: center;
        min-width: 30vw;
        max-width: 30vw;
    }

    .node > .nucleus > textarea,
    .node > .nucleus > .node-markdown
    {
        flex: 1;
    }

    .node-children {
        display: flex;
        flex-flow: column nowrap;
    }
</style>
