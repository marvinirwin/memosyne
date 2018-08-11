<template>
    <div style="position: relative">
        <div style="position: fixed; background-color: lightblue; opacity: 0.5;">
            <div  v-for="message in messages$">
                {{message}}
            </div>
        </div>
        <navbar></navbar>
        <node-container></node-container>
    </div>
    
</template>

<script>
    import Navbar from './navbar.vue';
    import NodeContainer from './node-container.vue';
    import showdown from 'showdown';

    const converter = new showdown.Converter();
    export default {
        name: "node-view-root",
        components: {NodeContainer, Navbar},
        data() {
            return {

            }
        },
        methods: {
        },
        computed: {
        },
        mounted () {
            document.converter = converter;
        },
        subscriptions() {
            return {
                messages$: this.net.messages$,
            }
        }
    }
</script>

<style scoped>

</style>