<template>
    <div class="navbar" style="display: flex; flex-flow: row nowrap;">
        <button @click="net.groupSelectedNodes$.next([]); net.createNode(null)">Create Root</button>
        <button @click="userExperience.logout()">
            Log out
        </button>
        <!--        <div style="font-size: 10px; height: fit-content; position: absolute; background-color: ">
                    {{messages$ | lastMessages}}
                </div>-->
        <div>
<!--            <input id="email"
                   @keydown.enter.stop.prevent="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.email"
                   placeholder="email"
                   style="color: white;"
                   type="email"
                   class="inp"
            >
            <input id="password"
                   @keydown.enter.stop.prevent="userExperience.login(userExperience.email, userExperience.password)"
                   v-model="userExperience.password"
                   type="password"
                   placeholder="password"
                   style="color: white;"
            >-->
            <a href="/auth/google">Sign in with google</a>
        </div>
        <div style="display: flex; flex-flow: column nowrap; justify-content: space-between">

<!--            <button class="waves-effect"
                    @click="userExperience.login(userExperience.email, userExperience.password)">
                <i class="material-icons right">Login</i>
            </button>
            <button class="waves-effect" @click="userExperience.logout()">
                <i class="material-icons right">Log out</i>
            </button>
            <button class="waves-effect"  @click="debug = !debug">
                <i class="material-icons right">Debug</i>
            </button>-->
<!--            <button  class="waves-effect" @click="userExperience.nodeLayout$.next(VERTICAL_TREE)">
                <i class="material-icons right">VERTICAL_TREE</i>
            </button>
            <button  class="waves-effect" @click="userExperience.nodeLayout$.next(HORIZONTAL_TREE)">

                <i class="material-icons right">HORIZONTAL_TREE</i>
            </button>
            <button  class="waves-effect" @click="userExperience.nodeLayout$.next(SOURCE_LIST)">
                <i class="material-icons right">SOURCE_LIST</i>
            </button>-->
        </div>
        <ul class="collection" style="flex: 1; color: black; margin: 5px; overflow: auto;">
            <li class="collection-item"
                v-for="loadingObject in net.db.loadingObjectList.loadingObjects">
                {{loadingObject.text}}
            </li>
        </ul>
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
<!--        <button @click="userExperience.nodeLayout$.next(SOURCE_LIST)">Source List</button>
        <button @click="userExperience.nodeLayout$.next(VERTICAL_TREE)">All Nodes</button>-->
    </div>
</template>

<script>
    import {map} from 'rxjs/operators';
    import {HORIZONTAL_TREE, SOURCE_LIST, VERTICAL_TREE} from "../net";

    export default {
        name: "navbar",
        mounted() {
        },
        data() {
            return {
                VERTICAL_TREE,
            HORIZONTAL_TREE,
            SOURCE_LIST,
            }
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