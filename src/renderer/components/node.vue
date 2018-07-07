<template>
    <div class="node" :class="node.class">

        <div class="nucleus"
             ref="nucleus"
             @click="nodeSelected({node, event: $event})"
        >

            <textarea
                    v-show="editing"
                    ref="textarea"
                    class="node-textarea"
                    v-model="text"
            ></textarea>

            <div v-show="!editing"
                 class="node-markdown"
                 ref="markdown"
                 v-html="markdown"
            ></div>

            <div class="node-attrs"
                 ref="attrs"
            ></div>

        </div>

        <div class="node-children">
            <node
                    v-for="child in node.children"
                    :key="child.id"
                    :node="child"
                    :siblings="node.children.filter(n => n !== child)"
            ></node>
        </div>
    </div>
</template>

<script>
    import {debounce} from 'lodash';
    import { mapMutations, mapGetters } from 'vuex';
    import Node from './node.vue';

    export default {
        name: "node",
        mounted() {
            this.debouncedPersistTextChange = debounce(() => {
                // this.node.persistTextChange(this._text)
            });
            this.text = this.node.latestText;
            this.$nextTick(this.fitTextArea);
            this.$nextTick(this.renderMarkdown);

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
            const vm = this;
            return {
                _text: this.node.latestText,
                get text() {
                    return this._text;
                },
                set text(v) {
                    this._text = v;
                    vm.$nextTick(vm.fitTextArea);
                    vm.debouncedPersistTextChange();
                },
                markdown: '',
            }
        },
        methods: {
            ...mapMutations(['nodeSelected']),
            renderMarkdown() {
                this.markdown = document.converter.makeHtml(this.text);
            },
            debouncedPersistTextChange() {

            },
            fitTextArea() {
                const tArea = this.$refs.textarea;
                const markdown = this.$refs.markdown;

                const nucleus = this.$refs.nucleus;
                const hLimit = window.innerHeight * 0.75;

                if (!this.editing) {
/*                    nucleus.style.height = tArea.scrollHeight < hLimit ? (tArea.scrollHeight) : (hLimit + "px");
                    nucleus.style.minHeight = '16px';*/
                    tArea.style.height = markdown.scrollHeight + "px";
                    tArea.style.minHeight = '16px';
                }

            },
        },
        computed: {
            ...mapGetters(['selectedNodes']),
            editing() {
                // debugger;
                return this.selectedNodes.indexOf(this.node) !== -1;
            }
        },
        watch: {
            editing() {
                this.$nextTick(this.fitTextArea);
            }
        }
    }
</script>

<style scoped>

</style>