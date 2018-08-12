<template>
    <div style="position: relative">
        <navbar></navbar>
        <node-container></node-container>
        <v-snackbar v-model="showUserMessages" >
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
    }
</script>

<style scoped>

</style>