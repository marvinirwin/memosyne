<template>
    <div style="position: relative">
        <div style="position: fixed; background-color: lightblue; opacity: 0.5;" v-if="$store.state.memosyne.net">
            <div  v-for="message in $store.state.memosyne.net.messages.reverse()">
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
                return net && net.messages;
            }
        },
        mounted () {
            document.converter = converter;
        }
    }
</script>

<style scoped>

</style>