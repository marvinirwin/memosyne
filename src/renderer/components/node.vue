<template>
    <div class="node"
         @keydown.stop="hotkey($event)"
         ref="root"
    >

        <div class="nucleus card-panel"
             :class="{
             groupSelected: groupSelected,
             editSelected: editSelected,
             preEditSelected: preEditSelected,
             'z-depth-4': groupSelected,
             persisted: latestRevision && latestRevision.persisted,
             }"
             tabindex="99"
             ref="nucleus"
             @click="handleClick($event)"
        >
<!--             @click="setSelectedNodes({nodes: [node]})"-->
            <textarea
                    ref="textarea"
                    class="node-textarea"
                    v-model="node.text"
                    @keydown.stop="handleTextboxPress($event)"
            ></textarea>

            <div
                 class="node-markdown"
                 ref="markdown"
                 v-html="markdown"
            >
<!--                @click="setSelectedNodes({nodes: [node]})"-->
            </div>
            <!--                    @click="setSelectedNodes({nodes: [node]})"-->
            <input
                    class="classification"
                    placeholder="classification"
                    @keydown.stop="()=>{}"
                    v-model="node.classification">

            <div class="selectable">
                <div ref="selectEl">
                    Select
                </div>
            </div>
            <div class="node-attrs"
                 ref="attrs"
                 tabindex="0">
                <div>
                    <span>Predecessor length: {{node.predecessorNodes.length}}</span>
                    <span>Successor length: {{node.successorNodes.length}}</span>
                </div>
                <div>
                    <span>Predecessor edges length: {{node.predecessorEdges$.getValue().length}}</span>
                    <span>Successor edges length: {{node.successorEdges$.getValue().length}}</span>
                </div>
            </div>
        </div>

        <div class="node-children">
            <node
                    v-for="(child, index) in node.successorNodes"
                    v-if="node.visible"
                    :ref="'child' + index"
                    :key="child.id"
                    :node="child"
                    :siblings="node.successorNodes.filter(n => n !== child)"
            ></node>
        </div>
    </div>
</template>

<script>
    import {debounce} from 'lodash';
    import {mapMutations, mapActions} from 'vuex';
    import Node from './node.vue';

    export default {
        name: "node",
        destroyed() {
            const i = this.node.vueInstances.indexOf(this);
            if (i === -1) {
                alert('Destroy hook couldnt find itself inside nodes vue instances!')
                return;
            }
            this.node.vueInstances.splice(i, 1);
            delete this.$store.state.memosyne.nodeElementMap[this.$refs.root];
        },
        mounted() {
            /**
             * @type Node
             */
            const node = this.node;
            node.latestRevision$.subscribe(v => {
                this.latestRevision = v;
            });
            // TODO Let's see if the subscription hook has access to the props
            // It doesn't look like it can, but there must be a better way
            this.node.groupSelected$.subscribe((v) => {
                this.groupSelected = v;
            });
            this.node.editSelected$.subscribe((v) => {
                this.editSelected = v;
            });
            this.node.preEditSelected$.subscribe(v => {
                this.preEditSelected = v;
            });

            node.vueInstances.push(this);
            this.$nextTick(this.fitTextArea);
            this.$nextTick(this.renderMarkdown);
            this.$store.state.memosyne.nodeElementMap[this.$refs.root] = this;
            this.showMarkdown();
        },
        props: {
            node: {
                type: Node,
                required: true,
            },
            siblings: {
                type: Array,
                required: true
            }
        },
        data() {
            return {
                markdown: '',
                latestRevision: undefined,
                /*                editSelected: false,*/
                groupSelected: false,
                editSelected: false,
                preEditSelected: false,
            }
        },
        methods: {
            ...mapMutations(['setSelectedNodes']),
            ...mapActions(['handleHotkeyPress', 'handleNewNode']),
            showTextArea() {
                this.$refs.textarea.style.display = 'block';
                this.$refs.markdown.style.display = 'none';
            },
            showMarkdown() {
                this.$refs.textarea.style.display = 'none';
                this.$refs.markdown.style.display = 'block';
            },
            /**
             *
             * @param event {KeyboardEvent}
             */
            handleTextboxPress(event) {
                if (this.preEditSelected) {
                    this.node.net.removePreEditingNode(this.node);
                    this.handleHotkeyPress({vueInstance: this, node: this.node, event: event});
                    event.preventDefault();
                }

/*                switch(event.key) {
                    case "ArrowLeft":
                    case "ArrowRight":
                    case "ArrowUp":
                    case "ArrowDown":
                        if (this.preEditSelected) {
                        }
                        break;
                    case "Escape":
                        this.handleHotkeyPress({vueInstance: this, node: this.node, event: event});
                        break;
                    case "Enter":
                        if (event.ctrlKey) {
                            const parents = this.node.net.groupSelectedNodes$.getValue();
                            this.handleNewNode({parents});
                        }
                }*/
            },
            handleClick(event) {
                this.node.net.setEditingNode(this.node);
            },
            renderMarkdown() {
                this.markdown = document.converter.makeHtml(this.node.text);
                this.$nextTick(() => this.fitTextArea());
            },
            fitTextArea() {
                const tArea = this.$refs.textarea;
                const markdown = this.$refs.markdown;

                const nucleus = this.$refs.nucleus;
                const hLimit = window.innerHeight * 0.75;

                if (!this.editSelected$) {
                    tArea.style.height = markdown.scrollHeight + "px";
                    tArea.style.minHeight = '16px';
                    /*                    tArea.style.height = markdown.scrollHeight + "px"; */
                } else {
                    tArea.style.height = markdown.scrollHeight + "px";
                    tArea.style.minHeight = '16px';
                    /*                    tArea.style.height = markdown.scrollHeight + "px"; */
                }
            },
            /**
             *
             * @param {KeyboardEvent} event
             */
            focusTextarea() {
                this.$refs.textarea.focus();
            },
            hotkey(event) {
                this.handleHotkeyPress({vueInstance: this, node: this.node, event});
            },
        },
        computed: {
        },
        watch: {
/*            selected() {
                if (!this.selected) {
                    this.renderMarkdown();
                }
            }*/
        },
        subscriptions() {
            /**
             * @type {Node}
             */
            const node = this.node;
            return {
                groupSelected$: node.groupSelected$,
                editSelected$: node.editSelected$,
                preEditSelected: node.preEditSelected$,
            }
        },
    }
</script>

<style scoped>

</style>