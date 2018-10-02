<template>
    <div style="position: relative" @keydown="net.handleHotkeyPress(null, null, $event)" ref="root">
        <div style="display: flex; flex-flow: column nowrap; position: fixed; background-color: lightgreen; z-index: 1; opacity: 0.5; border-radius: 0px;"
             v-if="debug">
            <div v-for="message in lastMessages$" style="margin: 0; padding: 0;">
                {{message}}
            </div>
        </div>
        <navbar style="
        height: auto;
        white-space: pre;
        max-height: 20vh;
        overflow: auto;
        width: 100%;
        padding: 0;
        margin: 0; border-radius: 0px;"
                class="card"
        ></navbar>
        <node-container v-if="nodeLayout$ === 'SOURCE_LIST'"
                              :nodes$="net.sourceNodes$">
        </node-container>
        <node-container v-else
                style="overflow: auto; max-height: 80vh;"
                :nodes$="net.displayRootNodes$"
        ></node-container>
        <v-snackbar v-model="showUserMessages">
            <div v-for="userMessage in userMessages">
                {{userMessage}}
            </div>
        </v-snackbar>
    </div>

</template>

<script>
    import Navbar from './navbar.vue';
    import NodeContainer from './node-container.vue';
    import showdown from 'showdown';
    import {map} from 'rxjs/operators';
    import {HORIZONTAL_TREE, VERTICAL_TREE, SOURCE_LIST} from "../net";
    import ExpandableNodeList from "./expandable-node-list";

    const converter = new showdown.Converter();
    converter.setOption('tables', true);
    export default {
        name: "node-view-root",
        components: {ExpandableNodeList, NodeContainer, Navbar},
        data() {
            const el = document.createElement('style');
            document.body.appendChild(el);
            return {
                userMessages: [],
                userMessageClearTimeout: undefined,
                nodeOrientationSheet: el,
            }
        },
        methods: {
            applyHorizontalRules() {
                this.nodeOrientationSheet.parentNode.removeChild(this.nodeOrientationSheet);
                this.nodeOrientationSheet = document.createElement('style');
                this.nodeOrientationSheet.innerText = `
                    .node-children {
                        display: flex;
                        flex-flow: column nowrap;
                    }

                    .nucleus:not(.editSelected) {
                        max-height: 30vh;
                        overflow: auto;
                    }
                    .node {
                        display: flex;
                    }
                `;
                document.body.appendChild(this.nodeOrientationSheet);
            },
            applyVerticalRules() {
                this.nodeOrientationSheet.parentNode.removeChild(this.nodeOrientationSheet);
                this.nodeOrientationSheet = document.createElement('style');
                this.nodeOrientationSheet.innerText = `
                    .node-children {
                        display: flex;
                        flex-flow: row nowrap;
                    }
                    .node {
                        display: flex;
                        flex-flow: column nowrap;
                        align-items: center;
                        margin-left: 5px;
                        margin-right: 5px;
                    }
                `;
                document.body.appendChild(this.nodeOrientationSheet);
            },
        },
        computed: {
            showUserMessages: {
                get() {
                    return this.userMessages.length;
                },
                set(v) {
                    this.userMessages = [];
                }
            }
        },
        mounted() {
            document.converter = converter;
            this.userExperience.nodeLayout$.subscribe(v => {
                switch (v) {
                    case SOURCE_LIST:
                        this.userExperience.checkLoginGetSourceNodes();
                        this.applyVerticalRules();
                        break;
                    case HORIZONTAL_TREE:
                        this.userExperience.checkLoginGetNodes();
                        this.applyHorizontalRules();
                        break;
                    case VERTICAL_TREE:
                        this.userExperience.checkLoginGetNodes();
                        this.applyVerticalRules();
                        break;
                }
            });
            this.userExperience.message$.subscribe(v => {
                this.userMessages.push(v);
                if (this.userMessageClearTimeout) {
                    clearTimeout(this.userMessageClearTimeout);
                }
                this.userMessageClearTimeout = setTimeout(() => {
                    this.userMessages = [];
                }, 5000)
            });

        },
        subscriptions() {
            this.userExperience.nodeLayout$.subscribe(v => {
                    switch (v) {
                    }
                }
            );
            return {
                lastMessages$: this.net.messages$.pipe(map(a => {
                    const start = a.length - 10;
                    const arr = start < 0 ?
                        a :
                        a.slice(start)
                    return arr.map((str, index) =>
                        index += ' ' + str
                    )
                })),
                nodeLayout$: this.userExperience.nodeLayout$,
            }
        },
    }
</script>

<style>

</style>