<template>
    <div class="navbar" style="display: flex; flex-flow: row nowrap;">
        <!--        <div style="font-size: 10px; height: fit-content; position: absolute; background-color: ">
                    {{messages$ | lastMessages}}
                </div>-->
        <div>
            <input id="email"
                   @keydown.enter="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.email"
                   placeholder="email"
                   style="color: white;"
                   type="email"
                   class="inp"
            >
            <input id="password"
                   @keydown.enter="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.password"
                   type="password"
                   placeholder="password"
                   style="color: white;"
            >
        </div>
        <div style="display: flex; flex-flow: column nowrap;">

            <button class="btn waves-effect"
                    @click="userExperience.login(userExperience.email, userExperience.password)">Login
                <i class="material-icons right">Login</i>
            </button>
            <button class="btn waves-effect" @click="userExperience.logout()">Log out
                <i class="material-icons right">Log out</i>
            </button>
        </div>
        <div>
            <ul class="collection">
                <li class="collection-item"
                    v-for="loadingObject in net.db.loadingObjectList.loadingObjects">
                    what {{loadingObject.text}}
                </li>
            </ul>
        </div>
<!--        <div>Loading: {{net.db.loadingObjectList.loadingObjects |
            displayLoadingObjects}}
        </div>-->

        <div style="display: flex; flex-flow: column nowrap;" v-if="debug">
            <!-- Will this need to be an observable because vue ownt detect changes to localStorage?
              Or will it wrap the getters and seeters in its own?-->
            <div>Logged in: {{userExperience.userId}}</div>
            <div>Parents: {{groupSelectedNodes$.length}}</div>
            <span>PreEdits: {{preEditSelectedNodes$.length}}</span>
            <span>Edits: {{editSelectedNodes$.length}}</span>
        </div>
        <!--        <div style="display: flex; flex-flow: column nowrap;">
                    <div id="div_email">Email: {{userExperience.email}}</div>
                </div>-->
        <!--        <div id="div_capacity">Capacity Fraction {{userExperience.capacityFraction}}</div>-->
        <!--            <button id="btn_newnode" @click="btnNewNodeClicked">New Node</button>
                    <button id="btn_deletenode" @click="btnDeleteNodesClicked">Delete Nodes</button>-->
    </div>
</template>

<script>
    import {map} from 'rxjs/operators';

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
                const start = a.length - 20;
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
                lastMessages$: this.net.messages$.pipe(
                    map(a => {
                            const start = a.length - 10;
                            return start < 0 ?
                                a :
                                a.slice(start);
                        }
                    )),
                groupSelectedNodes$: this.net.groupSelectedNodes$,
                preEditSelectedNodes$: this.net.preEditSelectedNodes$,
                editSelectedNodes$: this.net.editSelectedNodes$,

            }
        }
    }
</script>

<style scoped>

</style>