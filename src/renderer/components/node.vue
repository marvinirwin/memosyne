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
             style="display: flex; flex-flow: row nowrap;">
            <div style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
                <br><br>
                <button class="cbutton cbutton--effect-simo"
                        :class="{'cbutton--click': false}"
                        @click="node.currentClassification$.next(QUESTION_ANSWER)">
                    <i class="material-icons" style="color: black">list</i>
                </button>
                <button class="cbutton cbutton--effect-simo"
                        :class="{'cbutton--click': false}"
                        @click="node.currentClassification$.next(RAMBLE)"
                >
                    <i class="material-icons" style="color: black">book</i>
                </button>
                <button class="cbutton cbutton--effect-simo"
                        :class="{'cbutton--click': false}"
                        @click="node.currentClassification$.next(TUTORIAL)">
                    <i class="material-icons" style="color: black">subject</i>
                </button>
            </div>
            <div>
                <div class="button-row">
                    <!--                <span>{{formattedTimestamp}}</span>-->
                    <button class="btn-floating cbutton cbutton--effect-simo"
                            :class="{'cbutton--click': expanding}"
                            @click="handleExpandClicked()">
                        <i class="material-icons" style="color: black">expand_more</i>
                    </button>
                    <button class="btn-floating cbutton cbutton--effect-simo" :class="{'cbutton--click': creatingChild}"
                            @click="handleCreateChildClick()">
                        <i class="material-icons" style="color: black">note_add</i>
                    </button>
                    <button class="btn-floating cbutton cbutton--effect-simo"
                            :class="{'cbutton--click': !latestRevision.visible}"
                            @click="net.addNodeHideToQue([node])">
                        <i class="material-icons" style="color: black">cancel</i>
                    </button>

                    <i class="material-icons" v-if="groupSelected$" title="Group Selected">center_focus_weak</i>
                    <i class="material-icons" v-if="preEditSelected$" title="Pre Edit Selected">more_horiz</i>
                    <i class="material-icons" v-if="editSelected$" title="Edit Selected">edit</i>
                    <i class="material-icons" v-if="latestRevision.persisted" title="Persisted">check</i>
                    <!--                <button v-else class="cbutton cbutton&#45;&#45;effect-simo"
                                            :class="{'cbutton&#45;&#45;click': contracting}"
                                            @click="handleContractClicked()">
                                        <i class="material-icons" style="color: black">CONTRACT</i>
                                    </button>-->
                    <!--                <i class="material-icons" @click="net.expandNode(node)">Expand</i>-->
                </div>
                <!--             @click="setSelectedNodes({nodes: [node]})"-->
                <textarea
                        ref="textarea"
                        class="node-textarea"
                        :class="sizeClassification$"
                        v-model="node.text"
                        @keydown.stop="handleTextboxPress($event)"
                ></textarea>

                <div
                        class="node-markdown"
                        :class="sizeClassification$"
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
                        <span>Predecessor length: {{predecessorNodes$.length}}</span>
                        <span>Successor length: {{successorNodes$.length}}</span>
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
        </div>
        <div class="node-children" v-if="expanded$">
            <!-- Question children are stacked on top of each other -->
            <div v-if="questionChildren$.length" style="display: flex; flex-flow: column nowrap; border: solid black;">
                <node
                        v-if="node.visible"
                        v-for="(child, index) in questionChildren$"
                        :ref="'child' + index"
                        :key="child.id"
                        :node="child"
                ></node>
            </div>
            <!-- Ramble children have only their titles visible and must be expanded -->
            <node
                    v-if="node.visible"
                    v-for="(child, index) in rambleChildren$"
                    :ref="'child' + index"
                    :key="child.id"
                    :node="child"
            ></node>

            <!-- Tutorial children are visible I think children have only their titles visible and must be expanded -->
            <node
                    v-if="node.visible"
                    v-for="(child, index) in tutorialChildren$"
                    :ref="'child' + index"
                    :key="child.id"
                    :node="child"
            ></node>
        </div>
    </div>
</template>

<script>
    import {debounce} from 'lodash';
    import {Node, scrollUpElement} from '../net.js';
    import {filter, map} from 'rxjs/operators';
    import {QUESTION_ANSWER, RAMBLE, TUTORIAL} from "../net";
    import {merge, BehaviorSubject} from 'rxjs';

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
                creatingChild: false,
                expanding: false,
                contracting: false,
                QUESTION_ANSWER,
                TUTORIAL,
                RAMBLE,
            }
        },
        methods: {
            handleContractClicked() {
                (async () => {
                    this.contracting = true;
                    this.node.expanded$.next(false);
                    this.$nextTick(() => {
                        this.contracting = false;
                    });
                })()
            },
            handleExpandClicked() {
                (async () => {
                    if (this.node.expanded$.getValue()) {
                        this.node.expanded$.next(false);
                    } else {
                        if (this.node.childrenLoaded$.getValue()) {
                            this.node.expanded$.next(true);
                        } else {
                            this.expanding = true;
                            await this.userExperience.loadNodeDescendantsIntoNet(this.node);
                            this.expanding = false;
                            this.node.childrenLoaded$.next(true);
                            this.node.expanded$.next(true)
                        }
                    }
                })()
            },
            handleNodeHideClick() {

            },
            async handleCreateChildClick() {
                this.creatingChild = true;
                await this.net.createNode([this]);
                this.creatingChild = false;
            },
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
                this.$nextTick(() => {
                    this.markdownScrollHeight = this.$refs.markdown.scrollHeight;
                    this.fitTextArea();
                });
            },
            fitTextArea() {
                if (this.markdownScrollHeight === 0) return;
                const tArea = this.$refs.textarea;

                tArea.style.height = this.markdownScrollHeight + "px";
                tArea.style.minHeight = '16px';
            },
            focusTextarea() {
                this.$refs.textarea.focus();
            },
            hotkey(event) {
                this.net.handleHotkeyPress(this, this.node, event);
            },
            scrollUpElement,
            expandNode(n) {
                (async () => {
                    this.userExperience.pushMessage("Loading descendants of " + n.text);
                    this.userExperience.loadSourceNodesIntoNet(await this.userExperience.loadUserNodeDescendants(n));
                })()
            },
        },
        computed: {
            formattedTimestamp() {
                if (!this.latestRevision$ ||
                    !this.latestRevision$.m_createdTimestamp) {
                    return 'Not created'
                } else {
                    return this.latestRevision$.m_createdTimestamp.format('dddd, MMMM Do YYYY');
                }
            }
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
            // I need to scan my successor nodes.
            // I need to create subscription objects for all those nodes' classifications
            // I need to unsubscribe to the old nodes.
            // So I need to get an array of observables,
            // smush them all into one subscription which just runs the filters again,
            // and then when I scan, unsubscribe to them all
            // TODO what is the operator to bundle up observables?

            // Does subscribe return an observable?

            /**
             * {Observable}
             */
            let oldObservables;
            const questionChildren$ = new BehaviorSubject([]);
            const rambleChildren$ = new BehaviorSubject([]);
            const tutorialChildren$ = new BehaviorSubject([]);

            this.node.successorNodes$.subscribe(nodes => {
                if (oldObservables) {
                    oldObservables.unsubscribe();
                }
                oldObservables = merge(...nodes.map(node => node.currentClassification$)).subscribe(v => {
                    const nodes = this.node.successorNodes$.getValue();
                    questionChildren$.next(
                        nodes.filter(n => n.currentClassification$.getValue() === QUESTION_ANSWER));
                    rambleChildren$.next(
                        nodes.filter(n => n.currentClassification$.getValue() === RAMBLE));
                    tutorialChildren$.next(
                        nodes.filter(n => {
                            const cls = n.currentClassification$.getValue();
                            return cls === TUTORIAL || cls === '';
                        })
                    )
                })
            });


            return {
                // TOOD add expanded$ as a property of the node Class,
                // or maybe of just the Vue component
                expandable$: node.groupSelected$,
                groupSelected$: node.groupSelected$,
                editSelected$: node.editSelected$,
                preEditSelected$: node.preEditSelected$,
                predecessorEdges$: node.predecessorEdges$,
                successorEdges$: node.successorEdges$,
                successorNodes$: node.successorNodes$.pipe(map(nodes => {
                    return nodes.sort(function (a, b) {
                        return a.createdTimestamp - b.createdTimestamp
                    })
                })),
                expanded$: node.expanded$,
                latestRevision$: node.latestRevision$,
                sizeClassification$: node.sizeClassification$,
                questionChildren$, rambleChildren$, tutorialChildren$
            }
        },
    }
</script>

<style scoped>


</style>