<template>
    <div style="display: flex;">
        <div>
            {{messages$ | lastMessages}}
        </div>
        <div>
            <input id="email" @keydown.enter="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.email"
                   placeholder="email">
            <input id="password"
                   @keydown.enter="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.password" type="password" placeholder="password">
        </div>

        <div style="white-space: pre;">Loading: {{net.db.loadingObjectList.loadingObjects |
            displayLoadingObjects}}
        </div>

        <div style="display: flex; flex-flow: column wrap;">
            <!-- Will this need to be an observable because vue ownt detect changes to localStorage?
              Or will it wrap the getters and seeters in its own?-->
            <div>Logged in: {{userExperience.userId}}</div>
            <div>Parents: {{groupSelectedNodes$.length}}</div>
            <span>PreEdits: {{preEditSelectedNodes$.length}}</span>
            <span>Edits: {{editSelectedNodes$.length}}</span>
        </div>
        <div>
            <button id="btn_login" @click="userExperience.login(userExperience.email, userExperience.password)">Log in
            </button>
            <button id="btn_logout" @click="userExperience.logout()">Log out</button>
        </div>
        <div id="div_email">Email: {{userExperience.email}}</div>
<!--        <div id="div_capacity">Capacity Fraction {{userExperience.capacityFraction}}</div>-->
        <!--            <button id="btn_newnode" @click="btnNewNodeClicked">New Node</button>
                    <button id="btn_deletenode" @click="btnDeleteNodesClicked">Delete Nodes</button>-->

    </div>

</template>

<script>
    export default {
        name: "navbar",
        mounted() {
        },
        data() {
            return {}
        },
        filters: {
            displayLoadingObjects(a) {
                return a.map(a => a.text).join('\r\n');
            },
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
                groupSelectedNodes$: this.net.groupSelectedNodes$,
                preEditSelectedNodes$: this.net.preEditSelectedNodes$,
                editSelectedNodes$: this.net.editSelectedNodes$,

            }
        }
    }
</script>

<style scoped>

</style>