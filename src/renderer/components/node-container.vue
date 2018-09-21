<template>

    <div id="node-container"
         class="node-children"
         tabindex="255">
        <div
                v-for="(node, index) in nodes$"
                :key="node.id">
            <node
                    v-if="node.visible"
                    :node="node"
                    :siblings="nodes$.filter(n => n !== node)"
            ></node>
        </div>

        <div id="rectangle-select" hidden></div>
    </div>

</template>

<script>
    import Node from './node.vue';
    import {setFocusedInstance, sleep} from "../net";

    export const colorList = [
        '#DDDDDD',
        '#DDDDDD',
        '#DDDDDD',
        '#DDDDDD',
    ];

    export default {
        name: "node-container",
        props: {
            nodes$: {
                type: BehaviorSubject,
                required: true
            }
        },
        components: {Node},
        computed: {
        },
        data() {
            return {
                colorList
            }
        },
        mounted() {
            // const memosyne = this.$store.state.memosyne;
            // What happens if I remove all the event handlers, does it still happen?

        },
        methods: {
            calcColorIndex(index) {
                if (index === 0) {
                    return 0;
                }
                const listLength = this.colorList.length;
                const quot = index / listLength;
                if (quot < 1) {
                    return index;
                }
                const num = quot / Math.floor(quot);
                const i = num * listLength;
                return i - 1;
            },
            /**
             * @param {KeyboardEvent} e
             */
            handleTextboxPress(e) {
                this.handleHotkeyPress({vueInstance: this, node: undefined, event: e});
            }
        },
        subscriptions() {
            // This subscription will focus a node if none was focused originally, I think
            this.net.displayRootNodes$.subscribe(async n => {
                await sleep(1);
                this.net.pushMessage("Possibly auto-preEditing node");
                if (
                    this.net.displayRootNodes$.getValue().length &&
                    !this.net.editSelectedNodes$.getValue().length &&
                    !this.net.groupSelectedNodes$.getValue().length &&
                    !this.net.preEditSelectedNodes$.getValue().length
                ) {
                    this.net.pushMessage("Auto-preEditing node");
                    const focusedNode = this.net.displayRootNodes$.getValue()[0];
                    this.net.setPreEditingNode(focusedNode);
                    setFocusedInstance(this.net, null, focusedNode.vueInstances[0])
                }
            });
            this.net.displayRootNodes$.subscribe(v => {
                this.net.pushMessage(`Display root nodes new length: ${v.length}`);
            });
            /**
             * @type {Net}
             */
            return {
                displayRootNodes$: this.net.displayRootNodes$,
                nodes$: this.nodes$
            };
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