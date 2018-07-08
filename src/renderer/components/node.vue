<template>
    <div class="node"
         @keypress="handleKeyPress($event)"
    >

        <div class="nucleus"
             :class="{editing: editing, persisted: latestRevision && latestRevision.persisted}"
             tabindex="99"
             ref="nucleus"
             @click="nodeSelected({node, event: $event})">

            <textarea
                    v-show="editing"
                    ref="textarea"
                    class="node-textarea"
                    v-model="node.text"
            ></textarea>


            <div v-show="!editing"
                 class="node-markdown"
                 ref="markdown"
                 v-html="markdown"
            ></div>

            <input placeholder="classification" v-model="node.classification">

            <div class="node-attrs"
                 ref="attrs"
            ></div>

        </div>

        <div class="node-children">
            <node
                    v-for="(child, index) in node.children"
                    :ref="'child' + index"
                    :key="child.id"
                    :node="child"
                    :siblings="node.children.filter(n => n !== child)"
            ></node>
        </div>
    </div>
</template>

<script>
    import {debounce} from 'lodash';
    import {mapMutations, mapGetters} from 'vuex';
    import Node from './node.vue';

    export default {
        name: "node",
        mounted() {
            this.$nextTick(this.fitTextArea);
            this.$nextTick(this.renderMarkdown);
            this.node.latestRevision$.subscribe(v => {
                this.latestRevision = v;
            });
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
            }
        },
        methods: {
            ...mapMutations(['nodeSelected']),
            renderMarkdown() {
                this.markdown = document.converter.makeHtml(this.node.text);
                this.$nextTick(() => this.fitTextArea());
            },
            fitTextArea() {
                const tArea = this.$refs.textarea;
                const markdown = this.$refs.markdown;

                const nucleus = this.$refs.nucleus;
                const hLimit = window.innerHeight * 0.75;

                if (!this.editing) {
                    tArea.style.height = markdown.scrollHeight + "px";
                    tArea.style.minHeight = '16px';
                }

            },
            /**
             *
             * @param {KeyboardEvent} event
             */
            handleKeyPress(event) {
                let el;
                switch (event.key) {
                    case "ArrowLeft":
                        el = this.$parent.$el;
                        el.children[0].children[0].click();
                        break;
                    // This means I want to focus my first child?
                    case "ArrowRight":
                        el = this.$refs['child' + 0];
                        el.children[0].children[0].click();
                        break;
                }
            },
        },
        computed: {
            ...mapGetters(['selectedNodes']),
            editing() {
                return this.selectedNodes.indexOf(this.node) !== -1;
            }
        },
        watch: {
            editing() {
                if (!this.editing) {
                    this.renderMarkdown();
                }
            }
        }
    }
</script>

<style scoped>

</style>