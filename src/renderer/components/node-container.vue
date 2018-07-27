<template>

    <div id="node-container"
         class="node-children"
         tabindex="255">
<!-- @keydown.stop.prevent="handleKeyPress($event)"-->
        <div
                v-for="rootNode in displayRootNodes"
                :key="rootNode.id">
            <node
                    v-if="rootNode.visible"
                    :node="rootNode"
                    :siblings="displayRootNodes.filter(n => n !== rootNode)"
            ></node>
        </div>

        <div id="rectangle-select" hidden></div>
    </div>

</template>

<script>
    import Node from './node.vue';
    import {mapGetters, mapActions} from 'vuex';
    import {Subject} from 'rxjs';
    import {debounceTime} from 'rxjs/operators';

    export default {
        name: "node-container",
        components: {Node},
        data () {
            return {
                displayRootNodes: [],
            }
        },
        mounted() {
            // const memosyne = this.$store.state.memosyne;
            // What happens if I remove all the event handlers, does it still happen?

        },
        methods: {
            ...mapActions(['handleHotkeyPress', 'setSelectedNodes']),
            /**
             *
             * @param {KeyboardEvent} e
             */
            handleKeyPress(e) {
                this.handleHotkeyPress({vueInstance: this, node: undefined, event: e});
            }
        },
        subscriptions() {
            /**
             * @type {Net}
             */
            const memosyne = this.$store.state.memosyne;
            const net = memosyne.net;
            const observ = new Subject();
            net.recomputeDisplaySignal$.subscribe(
                () => {
                    observ.next(net.nodes.filter(memosyne.rootNodeFilter))
                }
            );
            observ.subscribe((v) => {
                this.displayRootNodes = v;
            });
            setTimeout(() => observ.next(net.nodes.filter(memosyne.rootNodeFilter)));
            return {

            }
        }
    }
</script>

<style scoped>
    .selection {
        background: rgba(0, 0, 255, 0.1);
        border-radius: 0.1em;
        border: 0.05em solid rgba(0, 0, 255, 0.2);
        pointer-events: none;
    }

    /*    #rectangle-select {
            border: 1px dotted #000;
            position: absolute;
            pointer-events: none;
        }*/
    /**
     * Creator: Simon R.
     */

    ::-webkit-scrollbar {
        width: 0.5em;
        height: 0.55em;
        background-color: #FAF9F7;
    }

    ::-webkit-scrollbar-thumb {
        background: #afafaf;
        border-radius: 0.2em;
    }

    * {
        margin: 0;
        padding: 0;
    }

    html,
    body {
        height: 100%;
    }

    body {
        background: #faf9f7;
    }

    header {
        text-align: center;
        letter-spacing: 0.2em;
        font-size: 2.5em;
        padding: 1.2em 0 0.5em 0;
    }

    header h1 {
        font-size: 1em;
        font-weight: 200;
    }

    header h1 .js {
        color: #14c3e3;
    }

    main .sec {
        width: 100%;
        max-width: 50em;
        margin: 3em auto;
    }

    main .sec .head {
        display: block;
        margin-bottom: 0.4em;
        font-size: 1.2em;
        text-align: center;
    }

    /* details */

    main section.demo .info {
        text-align: center;
        margin: 1em 0 2em 0;
        line-height: 2em;
        letter-spacing: 0.1em;
    }

    main section.demo .box-wrap {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
    }

    main section.demo .box-wrap.green {
        margin-bottom: 3em;
    }

    main .box-wrap::after {
        display: block;
        content: '';
        clear: both;
    }

    main .boxes div {
        height: 3em;
        width: 3em;
        margin: 0.2em;
        background: #f5f4f2;
        -webkit-box-shadow: 0 0.05em 0.2em 0 rgba(0, 0, 0, 0.1);
        box-shadow: 0 0.05em 0.2em 0 rgba(0, 0, 0, 0.1);
        border-radius: 0.15em;
        -webkit-transition: all 0.3s;
        -o-transition: all 0.3s;
        transition: all 0.3s;
        cursor: pointer;
    }

    main .boxes div.selected {
        -webkit-box-shadow: 0 0.05em 0.2em 0 rgba(0, 0, 0, 0.2);
        box-shadow: 0 0.05em 0.2em 0 rgba(0, 0, 0, 0.2);
    }

    main .boxes.green div.selected {
        background: #7febc2;
    }

    main .boxes.blue div.selected {
        background: #7fa0eb;
    }

    main section.demo-code pre {
        background: #F4F1EF;
        border-radius: 0.2em;
        font-size: 0.8em;
    }

    .keyboard-key {
        display: inline-block;
        font-weight: 600;
        text-transform: uppercase;
        color: #7c7f91;
        font-size: 0.9em;
        line-height: 1em;
        letter-spacing: -0.05em;
        padding: 0.2em 0.4em 0.3em 0.4em;
        border: 1px solid rgba(0, 0, 0, 0.6);
        border-radius: 0.15em;
        -webkit-box-shadow: inset 0 -0.15em 0 0 rgba(0, 0, 0, 0.3);
        box-shadow: inset 0 -0.15em 0 0 rgba(0, 0, 0, 0.3);
        -webkit-transform: translateY(-0.15em);
        -ms-transform: translateY(-0.15em);
        transform: translateY(-0.15em);
    }

    @media only screen and (max-width: 1000px) {

        #fork-me {
            height: 6em;
            width: 6em;
        }

        header {
            padding: 1em 0 0 0;
        }

        header h1 {
            font-size: 0.8em;
        }

        main section.demo .info {
            font-size: 0.8em;
        }

        main section.demo-code pre {
            font-size: 0.6em;
            margin: 0 1em;
            overflow: scroll;
        }
    }
</style>