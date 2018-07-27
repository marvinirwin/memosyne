<template>
    <div class="node"
         @keydown.stop="hotkey($event)"
         ref="root"
    >

        <div class="nucleus card-panel"
             :class="{
             selected: selected,
             'z-depth-4': selected,
             persisted: latestRevision && latestRevision.persisted
             }"
             tabindex="99"
             ref="nucleus"
             @click="setSelectedNodes({nodes: [node]})">

            <textarea
                    v-show="selected"
                    ref="textarea"
                    class="node-textarea"
                    v-model="node.text"
                    @keydown.stop="()=>{}"
            ></textarea>

            <div v-show="!selected"
                 class="node-markdown"
                 ref="markdown"
                 v-html="markdown"
                 @click="setSelectedNodes({nodes: [node]})"
            ></div>

            <input
                    @click="setSelectedNodes({nodes: [node]})"
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
                 ref="attrs" tabindex="0"
            >

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
            this.node.vueInstances.push(this);
            this.$nextTick(this.fitTextArea);
            this.$nextTick(this.renderMarkdown);
            this.node.latestRevision$.subscribe(v => {
                this.latestRevision = v;
            });
            this.$store.state.memosyne.selectedNodes$.subscribe(s => {
                this.selected = s.indexOf(this.node) !== -1;
            });
            this.$refs.textarea.focus();
            this.$store.state.memosyne.nodeElementMap[this.$refs.root] = this;
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
                selected: false
            }
        },
        methods: {
            ...mapMutations(['setSelectedNodes']),
            ...mapActions(['handleHotkeyPress']),
            renderMarkdown() {
                this.markdown = document.converter.makeHtml(this.node.text);
                this.$nextTick(() => this.fitTextArea());
            },
            fitTextArea() {
                const tArea = this.$refs.textarea;
                const markdown = this.$refs.markdown;

                const nucleus = this.$refs.nucleus;
                const hLimit = window.innerHeight * 0.75;

                if (!this.selected) {
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
            handleKeyPress(event) {
                if (event.key === "Escape") {
                    this.handleHotkeyPress({vueInstance: this, node: this.node, event: event});
                }
            },
            focusTextarea() {
                this.$refs.textarea.focus();
            },
            hotkey(event) {
                this.handleHotkeyPress({vueInstance: this, node: this.node, event});
            },
        },
        computed: {},
        watch: {
            selected() {
                if (!this.selected) {
                    this.renderMarkdown();
                }
            }
        }
    }
</script>

<style scoped>

</style>