<template>
    <div style="position: relative" @keydown="net.handleHotkeyPress(null, null, $event)">
        <div style="display: flex; flex-flow: column nowrap; position: fixed; background-color: lightgreen; z-index: 1; opacity: 0.5;"
             v-if="debug">
            <div v-for="message in lastMessages$" style="margin: 0; padding: 0;">
                {{message}}
            </div>
        </div>
        <navbar style="
        position: fixed;
        height: 20vh;
        white-space: pre;
        max-height: 20vh;
        overflow: auto;
        width: 100%;"></navbar>
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

    const converter = new showdown.Converter();
    export default {
        name: "node-view-root",
        components: {NodeContainer, Navbar},
        data() {
            return {
                userMessages: [],
                userMessageClearTimeout: undefined

            }
        },
        methods: {},
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
            this.userExperience.message$.subscribe(v => {
                this.userMessages.push(v);
                if (this.userMessageClearTimeout) {
                    clearTimeout(this.userMessageClearTimeout);
                }
                this.userMessageClearTimeout = setTimeout(() => {
                    this.userMessages = [];
                }, 5000)
            })
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
        }
    }
</script>

<style scoped>

</style>