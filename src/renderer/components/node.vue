<template>
    <div class="node"
         @keydown.stop="hotkey($event)"
         ref="root"
         v-show="latestRevision.visible"
    >

        <div class="nucleus card-panel"
             :class="{
             groupSelected: groupSelected$,
             editSelected: editSelected$,
             preEditSelected: preEditSelected$,
             'z-depth-4': groupSelected$,
             persisted: latestRevision.persisted,
             }"
             @mouseleave="scrollUpElement($refs.nucleus)"
             tabindex="99"
             ref="nucleus"
             @click="handleClick($event)"
        >
            <div>
                <span>{{
                    node.latestRevision$.getValue() &&
                    node.latestRevision$.getValue().m_createdTimestamp.format('dddd, MMMM Do YYYY')}}</span>
            </div>
            <!--             @click="setSelectedNodes({nodes: [node]})"-->
            <textarea
                    ref="textarea"
                    v-show=""
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
                    v-if="debug"
                    class="classification"
                    placeholder="classification"
                    v-model="node.classification">

            <div class="selectable" v-if="debug">
                <div ref="selectEl">
                    Select
                </div>
            </div>
            <div class="node-attrs"
                 ref="attrs"
                 tabindex="0" v-if="debug">
                <div>
                    <span>Predecessor length: {{node.predecessorNodes.length}}</span>
                    <span>Successor length: {{node.successorNodes.length}}</span>
                </div>
                <div>
                    <span>Predecessor edges length: {{predecessorEdges$.length}}</span>
                    <span>Successor edges length: {{successorEdges$.length}}</span>
                </div>
                <div>
                    <div>preEditSelected: {{preEditSelected$}}</div>
                    <div>editSelected: {{editSelected$}}</div>
                    <div>groupSelected: {{groupSelected$}}</div>
                    <div>node id: {{node.id}}</div>
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
    import {Node, scrollUpElement} from '../net.js';

    export default {
        name: "node",
        destroyed() {
            const i = this.node.vueInstances.indexOf(this);
            if (i === -1) {
                alert('Destroy hook couldnt find itself inside nodes vue instances!');
                return;
            }
            this.node.vueInstances.splice(i, 1);
            this.net.nodeElementMap.delete(this);
            // delete this.$store.state.memosyne.nodeElementMap[this.$refs.root];
        },
        mounted() {
            // this.$refs.nucleus.style.backgroundColor = this.colorList[this.colorIndex];
            /**
             * @type Node
             */
            const node = this.node;
            node.latestRevision$.subscribe(v => {
                this.latestRevision = v || {};
                this.renderMarkdown();
            });
            node.vueInstances.push(this);
            this.$nextTick(this.renderMarkdown);
            this.net.nodeElementMap.set(this, this.node);
            this.showMarkdown();
            this.scrollUpMarkdown = debounce(() => {
                // Whatever javascript scrolls up this.$refs.markdown
            }, 500);
        },
        props: {
            node: {
                type: Node,
                required: true,
            },
            siblings: {
                type: Array,
                required: true
            },
/*            colorList: {
                type: Array,
                required: true
            },
            colorIndex: {
                type: Number,
                required: true
            }*/
        },
        data() {
            return {
                markdown: '',
                markdownScrollHeight: 0,
                latestRevision: {},
            }
        },
        methods: {
            calcChildIndex() {
                return 0;
/*                return (this.colorIndex + 1) > this.colorList.length - 1 ?
                    0 :
                    this.colorIndex + 1
                    ;*/
            },
            /**
             * e {ScrollEvent}
             **/
            handleScroll(e) {

            },
            showTextArea() {
                this.$refs.textarea.style.display = 'block';
                this.$refs.markdown.style.display = 'none';
                this.fitTextArea()
            },
            showMarkdown() {
                if (this.node.text) {
                    this.showTextArea();
                }
                this.$refs.textarea.style.display = 'none';
                this.$refs.markdown.style.display = 'block';
                this.renderMarkdown()
            },
            /**
             *
             * @param event {KeyboardEvent}
             */
            handleTextboxPress(event) {
                if (this.preEditSelected$) {
                    if (event.key === "ArrowUp" ||
                        event.key === "ArrowDown" ||
                        event.key === "ArrowLeft" ||
                        event.key === "ArrowRight" ||
                        (event.key === 'e' && event.ctrlKey)) {
                        this.net.handleHotkeyPress(this, this.node, event);
                    } else {
                        this.node.net.editSelectedNodes$.next([this.node]);
                        // this.node.net.removePreEditingNode(this.node);
                    }
                }
                if (event.key === "Escape") {
                    this.net.handleHotkeyPress(this, this.node, event);
/*                    this.node.net.removePreEditingNode(this.node);
                    this.node.net.setPreEditingNode(this.node);
                    this.$refs.nucleus.focus();*/
                }

                if (event.ctrlKey && event.key === "Enter") {
                    this.node.net.createNode(this).catch(e => console.log(e));
                }
            },
            handleClick(event) {
                this.node.net.setEditingNode(this.node);
            },
            renderMarkdown() {
                this.markdown = document.converter.makeHtml(this.node.text);
                // Record the scrollHeight of our markdown when we can,
                // so that when we show the text area it has an idea of how big to make itself
                setTimeout(() => {
                    if (this.node.visible) {

                    }
                    this.markdownScrollHeight = this.$refs.markdown.scrollHeight;
                    this.fitTextArea();
                });
            },
            fitTextArea() {
                if (this.markdownScrollHeight === 0) return;
                const tArea = this.$refs.textarea;
                // const markdown = this.$refs.markdown;

                /*                const nucleus = this.$refs.nucleus;
                                const hLimit = window.innerHeight * 0.75;*/

                tArea.style.height = this.markdownScrollHeight + "px";
                tArea.style.minHeight = '16px';
                // this.net.pushMessage(`Markdown scroll height ${this.markdownScrollHeight}`);

                /*                if (!this.editSelected$) {
                                    /!*                    tArea.style.height = markdown.scrollHeight + "px"; *!/
                                } else {
                                    tArea.style.height = markdown.scrollHeight + "px";
                                    tArea.style.minHeight = '16px';
                                    /!*                    tArea.style.height = markdown.scrollHeight + "px"; *!/
                                }*/
            },
            focusTextarea() {
                this.$refs.textarea.focus();
            },
            hotkey(event) {
                this.net.handleHotkeyPress(this, this.node, event);
            },
            scrollUpElement,
        },
        computed: {},
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
                preEditSelected$: node.preEditSelected$,
                predecessorEdges$: node.predecessorEdges$,
                successorEdges$: node.successorEdges$,
            }
        },
    }
</script>

<style scoped>

</style>