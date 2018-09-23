<template>
    <div style="display: flex; flex-flow: column nowrap;">
        <div v-for="node in sub_nodes$" @click="expandNode(node)" class="nucleus card-panel">
            <div>{{node.id}}</div>
            <div>{{node.text}}</div>
            <div>{{node.childCount}}</div>
            <div v-if="node.expanded">
                <div v-if="node.loading">
                    <!-- TODO put a loading screen here -->
                    loading...
                </div>
                <node-container
                        :nodes$="node.successorNodes$"
                >
                </node-container>
            </div>
        </div>
    </div>
</template>

<script>
    import NodeContainer from './node-container.vue';
    import {BehaviorSubject} from 'rxjs';
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
                sub_nodes$: this.nodes$
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