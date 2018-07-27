<template>
    <div>
        <input id="input_email" @keydown.enter="$store.dispatch('login', {email, password})" v-model="email" >
        <input id="input_password" @keydown.enter="$store.dispatch('login', {email, password})" v-model="password" type="password">
        <button id="btn_login" @click="$store.dispatch('login', {email, password})">Log in</button>
        <button id="btn_logout" @click="$store.dispatch('logout')">Log out</button>
        <div id="div_email">Email: {{$store.state.memosyne.email}}</div>
        <div id="div_capacity">Capacity Fraction{{$store.state.memosyne.capacityFraction}}</div>
        <button id="btn_newnode" @click="btnNewNodeClicked">New Node</button>
        <button id="btn_deletenode" @click="btnDeleteNodesClicked">Delete Nodes</button>
    </div>
    
</template>

<script>
    import { mapActions } from 'vuex';
    export default {
        name: "navbar",
        mounted() {
        },
        data() {
            return {
                email: '',
                password: ''
            }
        },
        methods: {
            ...mapActions(['handleNewNode', 'handleDeleteNodes']),
            btnNewNodeClicked() {
                const parents = this.$store.state.memosyne.selectedNodes$.getValue();
                this.handleNewNode({parents});
            },
            btnDeleteNodesClicked() {
                this.handleDeleteNodes({nodes: this.$store.state.memosyne.selectedNodes$.getValue()});
            },
        }
    }
</script>

<style scoped>

</style>