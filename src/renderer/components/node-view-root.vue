<template>
    <div style="position: relative">
        <div style="position: fixed; background-color: lightblue; " v-if="$store.state.memosyne.net">
            <div  v-for="message in $store.state.memosyne.net.messages">
                {{message}}
            </div>
        </div>
        <navbar></navbar>
        <node-container v-if="$store.state.memosyne.net"></node-container>
    </div>
    
</template>

<script>
    import Navbar from './navbar.vue';
    import NodeContainer from './node-container.vue';
    import { mapActions, mapMutations } from 'vuex';
    import showdown from 'showdown';
    import {NetPersistor} from "../net";

    const converter = new showdown.Converter();
    export default {
        name: "node-view-root",
        components: {NodeContainer, Navbar},
        methods: {
            ...mapMutations(['setNetPersistor']),
            ...mapActions(['newNode', 'newEdge', 'persistNodeRevision', 'persistEdgeRevision', 'checkLoginGetNodes']),
        },
        computed: {
            messages() {
                const net = this.$store.memosyne.net;
                return net && net.messages;
            }
        },
        mounted () {
            document.converter = converter;
            this.$store.dispatch('checkLoginGetNodes').catch(console.log);

            this.setNetPersistor({
                netPersistor: new NetPersistor(
                    (node) => this.newNode({node}).then(() => node.persisted = true),
                    (edge) => this.newEdge({edge}).then(() => edge.persited = true),
                    (nodeRevision) => this.persistNodeRevision({nodeRevision}).then(() => nodeRevision.persited = true),
                    (edgeRevision) => this.persistEdgeRevision({edgeRevision}).then(() => edgeRevision.persited = true),
                )
            });
        }
    }
</script>

<style scoped>

</style>