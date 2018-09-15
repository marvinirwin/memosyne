<template>
    <div style="position: relative" @keydown="net.handleHotkeyPress(null, null, $event)" ref="root">
        <div style="display: flex; flex-flow: column nowrap; position: fixed; background-color: lightgreen; z-index: 1; opacity: 0.5;"
             v-if="debug">
            <div v-for="message in lastMessages$" style="margin: 0; padding: 0;">
                {{message}}
            </div>
        </div>
        <navbar style="
        position: fixed;
        height: auto;
        white-space: pre;
        max-height: 20vh;
        overflow: auto;
        width: 100%;
        padding: 0;
        margin: 0; "
                class="card"
        ></navbar>
        <node-container style="padding-top: 20vh;"></node-container>
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
    import {HORIZONTAL_TREE, VERTICAL_TREE} from "../net";

    const converter = new showdown.Converter();
    converter.setOption('tables', true);
    export default {
        name: "node-view-root",
        components: {NodeContainer, Navbar},
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
            }
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
                switch(v) {
                    case VERTICAL_TREE:
                        this.applyVerticalRules();
                        break;
                    case HORIZONTAL_TREE:
                        this.applyHorizontalRules();
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

            this.applyHorizontalRules();
            setTimeout(() => {
                this.userExperience.nodeLayout$.next(VERTICAL_TREE);
            }, 5000);
        },
        subscriptions() {
            return {
                lastMessages$: this.net.messages$.pipe(
                    map(a => {
                            const start = a.length - 10;
                            const arr = start < 0 ?
                                a :
                                a.slice(start)
                            return arr.map((str, index) =>
                                index += ' ' + str
                            )
                        }
                    )),
            }
        },
    }
</script>

<style>

</style>