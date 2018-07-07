<template>
    <div>
        <navbar></navbar>
        <node-container></node-container>
    </div>
    
</template>

<script>
    import Navbar from './navbar.vue';
    import NodeContainer from './node-container.vue';
    import { mapActions } from 'vuex';
    export default {
        name: "node-view-root",
        components: {NodeContainer, Navbar},
        methods: {
            ...mapActions(['checkLoginGetNodes'])
        },
        mounted () {
            this.$store.dispatch('checkLoginGetNodes').catch(console.log);
        }
    }
</script>

<style scoped>

</style>