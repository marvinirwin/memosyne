<template>
    <div>
        <input id="input_email" @keydown.enter="userExperience.login(email, password)" v-model="email" placeholder="email">
        <input id="input_password" @keydown.enter="userExperience.login(email, password)" v-model="password" type="password" placeholder="password">
        <button id="btn_login" @click="userExperience.login(email, password)">Log in</button>
        <button id="btn_logout" @click="userExperience.logout()">Log out</button>
        <div id="div_email">Email: {{userExperience.email}}</div>
        <div id="div_capacity">Capacity Fraction {{userExperience.capacityFraction}}</div>
        <button id="btn_newnode" @click="btnNewNodeClicked">New Node</button>
        <button id="btn_deletenode" @click="btnDeleteNodesClicked">Delete Nodes</button>
    </div>
    
</template>

<script>
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
            btnNewNodeClicked() {
                this.net.createNode(null).catch(e => console.log);
            },
            btnDeleteNodesClicked() {
/*                Net.handleDeleteNodes();*/
            },
        }
    }
</script>

<style scoped>

</style>