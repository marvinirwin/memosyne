<template>
    <div id="node-container" class="node-children">
        <div
                v-for="rootNode in displayRootNodes"
                :key="rootNode.id">
            <node
                    :node="rootNode"
                    :siblings="displayRootNodes.filter(n => n !== rootNode)"
            ></node>
        </div>
    </div>
</template>

<script>
    import Node from './node.vue';
    import { mapGetters } from 'vuex';
    export default {
        name: "node-container",
        components: {Node},
        computed: {
            ...mapGetters(['displayRootNodes']),
        }
    }
</script>

<style scoped>
</style>