<template>
    <div>
        <div style="position: fixed; background-color: lightblue; opacity: 0.5; height: 20vh; white-space: pre">
            {{messages$ | lastMessages}}
        </div>
        <div style="top: 20vh;">
            <input id="input_email" @keydown.enter="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.email"
                   placeholder="email">
            <input id="input_password" @keydown.enter="userExperience.login(userExperience.email, userExperience.password)" v-model="userExperience.password" type="password" placeholder="password">
            <button id="btn_login" @click="userExperience.login(userExperience.email, userExperience.password)">Log in</button>
            <button id="btn_logout" @click="userExperience.logout()">Log out</button>
            <div id="div_email">Email: {{userExperience.email}}</div>
            <div id="div_capacity">Capacity Fraction {{userExperience.capacityFraction}}</div>
            <button id="btn_newnode" @click="btnNewNodeClicked">New Node</button>
            <button id="btn_deletenode" @click="btnDeleteNodesClicked">Delete Nodes</button>
        </div>

    </div>
    
</template>

<script>
    export default {
        name: "navbar",
        mounted() {
        },
        data() {
            return {
            }
        },
        filters: {
            lastMessages(a) {
                const start = a.length - 10;
                return start < 0 ?
                    a.join('\r\n') :
                    a.slice(start).join('\r\n');
            }
        },
        methods: {
            btnNewNodeClicked() {
                this.net.createNode(null).catch(e => console.log);
            },
            btnDeleteNodesClicked() {
/*                Net.handleDeleteNodes();*/
            },
        },
        subscriptions() {
            return {
                messages$: this.net.messages$,
                groupSelectedNodes$:
            }
        }
    }
</script>

<style scoped>

</style>