<template>
    <div>
        <div v-for="node in nodes$" @click="expandNode(node)">
            <div>{{node.lastModified}}</div>
            <div>{{node.text}}</div>
            <div>{{node.count}}</div>
            <div v-if="node.expanded">
                <div v-if="node.loading">
                    <!-- TODO put a loading screen here -->
                    loading...
                </div>
                <node-container
                        :rootNodes="[node]"
                >

                </node-container>
            </div>
        </div>
    </div>
</template>

<script>
    import NodeContainer from './node-container.vue';
    export default {
        name: "expandable-node-list",
        props: {
            nodes$: {
                type: BehaviorSubject,
                required: true
            }
        },
        components: {
            NodeContainer
        },
        subscriptions() {
            return {
                nodes$: this.nodes$
            }
        },
        methods: {
            expandNode(n) {
                // TODO query all the nodes and edges below this one in the nestedSetsGraph
            }
        }
    }
</script>

<style scoped>

</style>