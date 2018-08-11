import {BehaviorSubject, Subject} from 'rxjs';
import {debounceTime, scan} from 'rxjs/operators'
import axios from 'axios';
import * as $ from 'jquery';

const USER_ID = 'USER_ID';

const api = 'api';
const UrlUsers = 'Users';
const UrlDefaultUser = 'DefaultUsers';
const UrlNodes = 'Nodes';
/*const UrlVNodes = 'VNodes';*/
const UrlEdges = 'Edges';
const UrlNodeRevisions = 'NodeRevisions';
const UrlEdgeRevisions = 'EdgeRevisions';

const netFilter = {
    include: [
        {
            relation: 'vNodes',
            scope: {
                where: {visible: true, text: {neq: null}},
                order: ['lastModified DESC'],
                include: [
                    {
                        relation: 'nodeRevisions',
                        scope: {
                            limit: 1,
                            order: ['createdTimestamp DESC'],
                        },
                    }
                ],
            },
        },
        {
            relation: 'edges',
            scope: {
                include: [
                    {
                        relation: 'edgeRevisions',
                        scope: {
                            limit: 1,
                            order: ['createdTimestamp DESC']
                        }
                    }
                ],
            },
        },
    ],
};

export class gen_Edge {
    constructor({id, createdTimestamp, userId}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
    }
}

export class gen_EdgeRevision {
    constructor({id, createdTimestamp, text, classification, edgeId, n1, n2, visible}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.text = text;
        this.classification = classification;
        this.edgeId = !isNaN(parseInt(edgeId + '', 10)) ? parseInt(edgeId + '', 10) : undefined;
        this.n1 = !isNaN(parseInt(n1 + '', 10)) ? parseInt(n1 + '', 10) : undefined;
        this.n2 = !isNaN(parseInt(n2 + '', 10)) ? parseInt(n2 + '', 10) : undefined;
        this.visible = visible;
    }
}

export class gen_Node {
    constructor({id, createdTimestamp, userId}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
    }
}

export class gen_NodeRevision {
    constructor({id, createdTimestamp, text, classification, nodeId, visible}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.text = text;
        this.classification = classification;
        this.nodeId = !isNaN(parseInt(nodeId + '', 10)) ? parseInt(nodeId + '', 10) : undefined;
        this.visible = visible;
    }
}

export class Node extends gen_Node {
    constructor(o) {
        super(o);
        /**
         * @type {Node[]}
         */
        this.predecessorNodes = [];
        /**
         * @type {Node[]}
         */
        this.successorNodes = [];
        /**
         * @type {Vue[]}
         */
        this.vueInstances = [];

        this.groupSelected$ = new BehaviorSubject(false);
        this.preEditSelected$ = new BehaviorSubject(false);
        this.editSelected$ = new BehaviorSubject(false);

        let latestR = undefined;
        if (o.nodeRevisions && o.nodeRevisions.length) {
            latestR = o.nodeRevisions[o.nodeRevisions.length - 1];
        }

        this.visible = latestR && latestR.visible;
        /**
         *
         * @type {BehaviorSubject<string>}
         */
        this.currentText$ = new BehaviorSubject(latestR && latestR.text || '');
        /**
         * @type {BehaviorSubject<string>}
         */
        this.currentClassification$ = new BehaviorSubject(latestR && latestR.classification || '');
        /**
         * @type {BehaviorSubject<NodeRevision[]>}
         */
        this.nodeRevisions$ = new BehaviorSubject([]);
        /**
         *
         * @type {BehaviorSubject<NodeRevision>}
         */
        this.latestRevision$ = new BehaviorSubject(undefined);
        // What is this for?
        this.revisionPublisher$ = new BehaviorSubject(undefined);
        /**
         *
         * @type {BehaviorSubject<Edge[]>}
         */
        this.successorEdges$ = new BehaviorSubject([]);
        /**
         *
         * @type {BehaviorSubject<Edge[]>}
         */
        this.predecessorEdges$ = new BehaviorSubject([]);
        /**
         * @type {Net}
         */
        this.net = undefined;


        this.persisted = false;

        // If we get any edges check if any of them belong to us and put them into successorEdges

        // If there are any new nodes check if we're related to them
        // and check our edges to see if we should stick them into our predecessor
        /*        this.netNodes$.subscribe(() => {
                    this.assignSuccessorAndPredecessorNodes();
                });*/
        /*        this.successorEdges$.pipe(debounceTime(0)).subscribe(() => this.assignSuccessorAndPredecessorNodes());
                this.predecessorEdges$.pipe(debounceTime(0)).subscribe(() => this.assignSuccessorAndPredecessorNodes());*/

        this.nodeRevisions$.pipe(debounceTime(0)).subscribe(r => {
            if (!r || !r.length) return;
            this.latestRevision$.next(r[r.length - 1]);
        });
        this.latestRevision$.pipe(debounceTime(0)).subscribe(v => {
            if (v) {
                this.visible = v.visible;
            }
        });

        this.currentText$.pipe(debounceTime(1000)).subscribe(() => this.checkNodeRevisions());
        this.currentClassification$.pipe(debounceTime(1000)).subscribe(() => this.checkNodeRevisions());

        // Fill our noderevisions with nodeRevisions which we know have already been persisted
        if (o.nodeRevisions && o.nodeRevisions.length) {
            this.nodeRevisions$.next(o.nodeRevisions.map(o => new NodeRevision(o, true)));
        } else {
            this.nodeRevisions$.next([]);
        }
    }

    /**
     *
     * @param n {Net}
     */
    setNet(n) {
        this.net = n;
        n.recomputeRelationSignal$.subscribe(
            () => {
                this.assignSuccessorAndPredecessorNodes()
            }
        );
    }

    checkEdgeRevisions() {
        this.successorEdges$.next([]);
        this.predecessorEdges$.next([]);
        for (let i = 0; i < this.net.edges.length; i++) {
            const edge = this.net.edges[i];
            if (edge.n1 === this.id) {
                this.successorEdges$.next(this.successorEdges$.getValue().concat(edge));
            }
            if (edge.n2 === this.id) {
                this.predecessorEdges$.next(this.predecessorEdges$.getValue().concat(edge));
            }
        }
    }

    checkNodeRevisions() {
        const latestRevision = this.latestRevision$.getValue();
        if (!latestRevision) {
            return;
        }
        const currentClassification = this.currentClassification$.getValue() || '';
        const currentText = this.currentText$.getValue() || '';
        if (currentClassification !== (latestRevision.classification || '') ||
            currentText !== (latestRevision.text || '')) {
            this.submitNewRevision();
        }
    }

    submitNewRevision() {
        const newRevision = new NodeRevision({
            text: this.currentText$.getValue(),
            classification: this.currentClassification$.getValue(),
            nodeId: this.id,
            visible: this.visible,
        }, false);
        this.revisionPublisher$.next(newRevision);
        this.nodeRevisions$.next(this.nodeRevisions$.getValue().concat(newRevision));
    }

    assignSuccessorAndPredecessorNodes() {
        this.successorNodes = [];
        this.predecessorNodes = [];
        const successorEdges = this.successorEdges$.getValue();
        const predecessorEdges = this.predecessorEdges$.getValue();
        const nodes = this.net ? this.net.nodes : [];

        /*        if (this.text && this.text.contains('love')) {
                    debugger;console.log();
                }*/

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            for (let j = 0; j < successorEdges.length; j++) {
                const successorEdge = successorEdges[j];
                if (successorEdge.n2 === node.id) {
                    this.successorNodes.push(node);
                    successorEdge.nodeEnd = node;
                }
            }
            for (let j = 0; j < predecessorEdges.length; j++) {
                const predecessorEdge = predecessorEdges[j];
                if (predecessorEdge.n1 === node.id) {
                    this.predecessorNodes.push(node);
                    predecessorEdge.nodeStart = node;
                }
            }
        }
    }

    // Helper functions for getting and setting & classification

    get text() {
        return this.currentText$.getValue() || '';
    }

    set text(v) {
        this.currentText$.next(v);
    }

    get classification() {
        return this.currentClassification$.getValue();
    }

    set classification(v) {
        this.currentClassification$.next(v);
    }
}

export class NodeRevision extends gen_NodeRevision {
    /**
     *
     * @param o
     * @param {boolean} persisted
     */
    constructor(o, persisted) {
        super(o);

        /*        this.persisted = persisted;*/
    }
}

export class Edge extends gen_Edge {
    constructor(o) {
        super(o);
        /**
         * @type {Net}
         */
        this.net = undefined;
        const edgeRevisions = o.edgeRevisions ?
            o.edgeRevisions.map(o => new gen_EdgeRevision(o)) :
            [];
        this.edgeRevisions$ = new BehaviorSubject(edgeRevisions);
        this.revisionPublisher$ = new BehaviorSubject(undefined);
        this.nodeStart = undefined;
        this.nodeEnd = undefined;

        this.n1 = undefined;
        this.n2 = undefined;

        this.edgeRevisions$.subscribe(revisions => {
            if (!revisions.length) {
                this.n1 = undefined;
                this.n2 = undefined;
                return;
            }

            const latest = revisions[revisions.length - 1];
            this.n1 = latest.n1;
            this.n2 = latest.n2;
        });

        this.persisted = true;
    }

    /**
     * @param n {Net}
     */
    setNet(n) {
        this.net = n;
    }
}

export class EdgeRevision extends gen_EdgeRevision {
    constructor(o) {
        super(o);
        this.persisted = false;
    }
}

/**
 *
 * @param n {number}
 * @return {Promise<void>}
 */
export function sleep(n) {
    return new Promise((resolve) => {
        setTimeout(n, resolve);
    });
}

function resolveApiUrl(...args) {
    return [process.env.API_HOST].concat(args).join('/');
}

/**
 *
 * @param net {Net}
 * @param oldInstance {Vue}
 * @param newInstance {Vue}
 */
export function setFocusedInstance(net, oldInstance, newInstance) {
    /**
     * This is the part of the node we focus
     * @type {HTMLElement}
     */
    const el = newInstance.$refs.nucleus;
    $('html,body').animate({scrollTop: $(el).offset().top - ($(window).height() - $(el).outerHeight(true)) / 2}, 200);

    event.stopPropagation();
    event.preventDefault();

    newInstance.showTextArea();
    newInstance.$refs.textarea.focus();
    net.removePreEditingNode(newInstance.node);
    net.setPreEditingNode(newInstance.node);
    net.groupSelectedNodes$.next([newInstance.node]);
}

export class Net {
    /**
     * @param {Node[]} nodes
     * @param {Edge[]} edges
     * @param {NetPersistor} db
     */
    constructor(nodes, edges, db) {
        /**
         * @type {Node[]}
         */
        this.nodes = [];
        /**
         *
         * @type {Edge[]}
         */
        this.edges = [];
        /**
         * @type {NetPersistor}
         */
        this.db = db;

        /**
         * @type {BehaviorSubject<string[]>}
         */
        this.messages$ = new BehaviorSubject([]);

        /**
         *
         * @param n {Node}
         */
        this.rootNodeFilter = (n) => {
            return n.predecessorEdges$.getValue().length === 0;
        };

        this.recomputeDisplaySignal$ = new Subject();
        this.recomputeRelationSignal$ = new Subject();

        /**
         * @type {BehaviorSubject<Node>}
         */
        this.groupSelectedNodes$ = new BehaviorSubject([]);
        /**
         * @type {BehaviorSubject<Node>}
         */
        this.preEditSelectedNodes$ = new BehaviorSubject([]);
        /**
         * @type {BehaviorSubject<Node>}
         */
        this.editSelectedNodes$ = new BehaviorSubject([]);

        this.addNodesAndEdges(nodes, edges);

        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.displayRootNodes$ = new BehaviorSubject([]);

        /**
         * @type {BehaviorSubject<void>}
         */
        this.recomputeDisplaySignal$.subscribe(n => {
            this.messages$.next(this.messages$.getValue().concat("Recaculating displayRootNodes"));
            this.displayRootNodes$.next(this.nodes.filter(this.rootNodeFilter));
        })

        /**
         * @type {Map<Vue, Node>}
         */
        this.nodeElementMap = new Map();

        /*        this.viewportManager = new ViewportManager();*/


        // Take care of the transformation which needs to happen when we apply different kinds of selections to nodes
        // HACK I don't think I should be relying on scan for side effects here
        this.preEditSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
/*            this.pushMessage("Scan operator got called");*/
            /**
             *
             * @param n {Node}
             */
            const previousFunc = (n) => {
                n.preEditSelected$.next(false);
                n.vueInstances.map(v => v.showMarkdown());
            };
            /**
             *
             * @param n {Node}
             */
            const newFunc = (n) => {
                n.preEditSelected$.next(true);
                n.vueInstances.map(v => v.showTextArea());
            };
            previousNodes.map(previousFunc);
            newNodes.map(newFunc);
            return newNodes;
        })).subscribe();
        this.editSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
/*            this.pushMessage("Scan operator got called");*/
            /**
             *
             * @param n {Node}
             */
            const previousFunc = (n) => {
                n.editSelected$.next(false);
                n.vueInstances.map(v => v.showTextArea());
            };
            /**
             *
             * @param n {Node}
             */
            const newFunc = (n) => {
                n.preEditSelected$.next(true);
                n.vueInstances.map(v => v.showMarkdown());
            };
            previousNodes.map(previousFunc);
            newNodes.map(newFunc);
            return newNodes;
        })).subscribe();
        this.groupSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
            /**
             *
             * @param n {Node}
             */
            const previousFunc = (n) => {
                n.groupSelected$.next(false);
            };
            /**
             *
             * @param n {Node}
             */
            const newFunc = (n) => {
                n.groupSelected$.next(true);
            };
            previousNodes.map(previousFunc);
            newNodes.map(newFunc);
            return newNodes;
        })).subscribe();
    }

    /**
     * @param newNodes {Node[]}
     * @param newEdges {Edge[]}
     */
    addNodesAndEdges(newNodes, newEdges) {
        this.messages$.next(this.messages$.getValue('Adding nodes and edges'));
        const oldNodes = this.nodes;
        const oldEdges = this.edges;
        for (let i = 0; i < newNodes.length; i++) {
            const newNode = newNodes[i];
            newNode.setNet(this);
            newNode.revisionPublisher$.subscribe(v => {
                if (v) {
                    this.db.queNodeRevision.push(v);
                }
            });
            oldNodes.push(newNode);
        }
        for (let i = 0; i < newEdges.length; i++) {
            const newEdge = newEdges[i];
            newEdge.setNet(this);
            newEdge.revisionPublisher$.subscribe(v => {
                if (v) {
                    this.db.queEdge.push(v);
                }
            });
            oldEdges.push(newEdge);
        }
        for (let i = 0; i < oldNodes.length; i++) {
            const oldNode = oldNodes[i];
            oldNode.checkEdgeRevisions();
        }

        this.recomputeRelationSignal$.next();
        this.recomputeDisplaySignal$.next();
    }

    /**
     * This is what happens when you click on a node,
     * erases everyone and just selects one
     * @param n {Node}
     */
    setEditingNode(n) {
        this.messages$.next(this.messages$.getValue().concat('Setting editing node'));
/*        this.groupSelectedNodes$.getValue().map(n => n.groupSelected$.next(false));
        this.editSelectedNodes$.getValue().map(n => {
            n.editSelected$.next(false);
            n.vueInstances.map(v => v.showMarkdown());
        });
        this.preEditSelectedNodes$.getValue().map(n => n.preEditSelected$.next(false));

        n.groupSelected$.next(true);
        n.editSelected$.next(true);
        n.preEditSelected$.next(false);*/

        // Once we set a new editing node, set the previous ones to not editing
/*        this.editSelectedNodes$.getValue().map(n => n.vueInstances.map(v => v.showMarkdown()));*/

        this.groupSelectedNodes$.next([n]);
        this.editSelectedNodes$.next([n]);
        this.preEditSelectedNodes$.next([]);
        n.vueInstances.map(v => {
            v.showTextArea();
        });
    }

    /**
     * This is what happens when you switch with an arrow key.
     * Clears the net's preEditSelected and sets it to just the target
     * Sets the node groupSelected to true, editSelected to false and preEditSelected to true
     * @param n {Node}
     */
    setPreEditingNode(n) {
        this.pushMessage('Setting preEditingNode');
/*        this.preEditSelectedNodes$.getValue().map(n => {
                n.preEditSelected$.next(false);
                n.vueInstances.map(v => v.showMarkdown());
            }
        );*/

/*        n.groupSelected$.next(true);
        n.editSelected$.next(false);
        n.preEditSelected$.next(true);*/


        this.preEditSelectedNodes$.next([n]);
    }

    /**
     * @param n {Node}
     */
    removePreEditingNode(n) {
        this.pushMessage('Removing pre-editing node');
        this.preEditSelectedNodes$.getValue().map(n => n.preEditSelected$.next(false));
        n.preEditSelected$.next(false);
        this.preEditSelectedNodes$.next([n]);
    }

    /**
     * @param parentInstance {Vue}
     */
    async createNode(parentInstance) {
        const groupSelectedNodes = this.groupSelectedNodes$.getValue();
        this.pushMessage("Creating node with " + groupSelectedNodes.length + " parents");

        if (!parentInstance) {
            const newNode = await Net.newNode(new Node({}));
            this.addNodesAndEdges([newNode], []);
            debugger;
            return;
        }

        /**
         * @type {Node}
         */
        const parentNode = parentInstance.node;
        const parentVueInstanceIndex = parentNode.vueInstances.findIndex(v => v.node.id === parentInstance.node.id);
        const newNode = await Net.newNode({});
        this.addNodesAndEdges([newNode], []);
        // Create the new node, push it into the net, wait for the DOM to update the vue instances and then find the vue instance we're focusing
        await sleep(1);
        const newParentInstance = parentNode.vueInstances[parentVueInstanceIndex];
        const childInstance = newParentInstance.$children.find(instance => instance.node.id === newNode);
        // setFocusedInstance(childInstance);
        // Maybe I should reset the focuses and add the new, focused instance to preEditSelected$
    }

    /**
     * @param i {any}
     */
    pushMessage(i) {
        this.messages$.next(this.messages$.getValue().concat(i));
    }

    /**
     *
     * @param node
     * @return {Promise<Node>}
     */
    static async newNode(node) {
        const returned = await axios.post(resolveApiUrl(api, UrlNodes), node);
        const result = await axios.get(resolveApiUrl(api, UrlNodes, returned.data.id + ''));
        return new Node(result.data);
    }

    /**
     * @param {Edge} edge
     * @return {Promise<Edge>}
     */
    static async newEdge(edge) {
        const returned = await axios.post(resolveApiUrl(api, UrlEdges), edge);
        const result = await axios.get(resolveApiUrl(api, UrlEdges, returned.data.id + ''));
        return new Edge(result.data);
    }

    /**
     *
     * @param {gen_NodeRevision} nodeRevision
     * @return {Promise<NodeRevision>}
     */
    static async persistNodeRevision(nodeRevision) {
        const result = nodeRevision.id ?
            await axios.put(resolveApiUrl(api, UrlNodeRevisions, nodeRevision.id + ''), nodeRevision) :
            await axios.post(resolveApiUrl(api, UrlNodeRevisions), nodeRevision);
        const newNodeRevision = await axios.get(
            resolveApiUrl(api,
                UrlUsers,
                localStorage.getItem(USER_ID),
                'Nodes',
                nodeRevision.nodeId + '',
                'NodeRevisions',
                result.data.id + '',
            ));

        const revision = new NodeRevision(newNodeRevision.data);
        revision.persisted = true;
        return revision;
    }

    /**
     *
     * @param {EdgeRevision} edgeRevision
     * @return {Promise<EdgeRevision>}
     */
    static async persistEdgeRevision(edgeRevision) {
        const result = edgeRevision.id ?
            await axios.put(resolveApiUrl(api, UrlEdgeRevisions, edgeRevision.id + '')) :
            await axios.post(resolveApiUrl(api, UrlEdgeRevisions), edgeRevision);
        const revisitionResult = await axios.get(
            resolveApiUrl(api, UrlUsers,
                localStorage.getItem(USER_ID),
                UrlEdges,
                edgeRevision.edgeId + '',
                UrlEdgeRevisions,
                result.data.id + ''));


        return new EdgeRevision(revisitionResult.data);
    }

    /**
     *
     * @param {Vue} vueInstance
     * @param {Node} node
     * @param {KeyboardEvent} event
     */
    async handleHotkeyPress(vueInstance, node, event) {
        this.pushMessage("Handling hotkey press " + event.key);
        let newInstance;
        let siblingInstances = [];
        let myIndex = -1;
        /*        const selectedNodes = this.groupSelectedNodes$.getValue();*/
        switch (event.key) {
            // CTRL+e is the hotkey to erase a node
            case "e":
                if (event.ctrlKey) {
                    Net.deleteNodes([node]);
                }
                break;
            case "Enter":
                this.pushMessage('Enter pressed, createNode');
                // If there aren't any nodes selected create a root node
                await this.createNode();
                break;
            case "Escape":
                // If you pressed escape then de-select all nodes;
                this.pushMessage('Escape pressed, unselecting all');
                this.groupSelectedNodes$.next([]);
                this.editSelectedNodes$.next([]);
                this.setPreEditingNode(node);
                break;
            case "ArrowLeft":
                // In the case of a left arrow we want to go to
                // that vue instance's immediate parent's node
                this.pushMessage('Arrow left pressed, selecting parent');
                let parent = vueInstance.$parent;
                // If we're at a root node then the parent wont have a node, so don't go anywhere
                if (parent.node) {
                    setFocusedInstance(this, vueInstance, parent);
                }
                break;
            case "ArrowRight":
                this.pushMessage('Arrow left pressed, selecting child');
                let children = vueInstance.$children;
                let childrenLength = children.length;
                if (!childrenLength) {
                    return;
                }
                let i = childrenLength % 2 ?
                    (childrenLength / 2) + 0.5 - 1 :
                    childrenLength / 2;

                setFocusedInstance(this, vueInstance, children[i]);
                break;
            case "ArrowUp":
                this.pushMessage('Arrow up pressed, selecting sibling');
                siblingInstances = vueInstance.$parent.$children;
                // If we have no siblings than we can't go up
                for (let i = 0; i < siblingInstances.length; i++) {
                    const siblingInstance = siblingInstances[i];
                    if (siblingInstance === vueInstance) {
                        myIndex = i;
                    }
                }
                // Once we have
                if (myIndex === -1) {
                    alert("Could not find self in parent's successorNodes handling ArrowDown");
                    return;
                }
                // myIndex = siblingRefs.findIndex((r) => .isSameNode(r));
                if (myIndex === 0) {
                    myIndex = siblingInstances.length - 1;
                } else {
                    myIndex--;
                }
                newInstance = siblingInstances[myIndex];
                setFocusedInstance(this, vueInstance, newInstance);
                break;
            case "ArrowDown":
                this.pushMessage('Arrow down pressed, selecting sibling');
                siblingInstances = vueInstance.$parent.$children;
                // Try to find the index of myself so I can go one down
                for (let i = 0; i < siblingInstances.length; i++) {
                    const siblingInstance = siblingInstances[i];
                    if (siblingInstance === vueInstance) {
                        myIndex = i;
                    }
                }
                // Once we have
                if (myIndex === -1) {
                    alert("Could not find self in parent's successorNodes handling ArrowDown");
                    return;
                }
                // myIndex = siblingRefs.findIndex((r) => .isSameNode(r));
                if (myIndex === (siblingInstances.length - 1)) {
                    myIndex = 0;
                } else {
                    myIndex++;
                }
                newInstance = siblingInstances[myIndex];
                setFocusedInstance(this, vueInstance, newInstance);
                break;
        }
    }

    /**
     *
     * @param nodes {Node[]}
     * @return {Promise<void>}
     */
    static async deleteNodes(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            /**
             * @type {NodeRevision}
             */
            const o = node.latestRevision$.getValue();
            o.visible = false;
            await Net.persistNodeRevision(o);
        }
    }

    /**
     *
     * @param {String} text
     * @param {String} classification
     * @param {Node[]} parents
     * @return {Promise<{node: Node, edges: Edge[]}>}
     */
    static async createNodeAndEdges(text, classification, parents) {
        const newNode = await Net.newNode();
        const newNodeRevision = await Net.persistNodeRevision(
            new gen_NodeRevision({
                text,
                classification,
                nodeId: newNode.id
            }));

        newNode.nodeRevisions$.next(newNode.nodeRevisions$.getValue().concat(newNodeRevision));
        const newEdges = [];
        if (parents) {
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                const edge = await Net.newEdge({});
                const revision = await Net.persistEdgeRevision(
                    {
                        edgeId: edge.id,
                        n1: parent.id,
                        n2: newNode.id,
                        classification: 'parent',
                    });
                edge.edgeRevisions$.next(edge.edgeRevisions$.getValue().concat(revision));
                newEdges.push(edge);
            }
        }
        return {node: newNode, edges: newEdges};
    }

}

/**
 * Persists a node, both in localStorage and to an api
 * @callback NodePersistor
 * @param {Node} node
 */
/**
 * Persists an edge, both in localStorage and to an api
 * @callback EdgePersistor
 * @param {Edge} edge
 */

/**
 * Persists an edgeRevision, both in localStorage and to an api
 * @callback EdgeRevisionPersistor
 * @param {EdgeRevision} edgeRevision
 */
/**
 * Persists a nodeRevision, both in localStorage and to an api
 * @callback NodeRevisionPersistor
 * @param {NodeRevision} nodeRevision
 */

export class NetPersistor {
    /**
     * @param {NodePersistor} persistNode
     * @param {EdgePersistor} persistEdge
     * @param {NodeRevisionPersistor} persistNodeRevision
     * @param {EdgeRevisionPersistor} persistEdgeRevision
     * @param localstorageKey {String}
     */
    constructor(persistNode, persistEdge, persistNodeRevision, persistEdgeRevision, localstorageKey) {
        this.persistNode = persistNode;
        this.persistEdge = persistEdge;
        this.persistNodeRevision = persistNodeRevision;
        this.persistEdgeRevision = persistEdgeRevision;

        /**
         *
         * @param prop {String}
         * @param arr {Array}
         */
        const wrapperFunc = (prop, arr) => {
            const key = localstorageKey + prop;
            // Let's put this in the wrapper func for expedience
            const loadedString = localStorage.getItem(key);

            let loadedResult;
            try {
                loadedResult = JSON.parse(loadedString);
            } catch (e) {
                console.log(e);
            }

            if (loadedResult && Array.isArray(loadedResult)) {
                this[prop] = loadedResult;
            }

            arr.oldPush = arr.push;
            const newPush = (...v) => {
                arr.oldPush(...v);
                localStorage.setItem(key, JSON.stringify(arr));
            };

            arr.oldSlice = arr.slice;
            const newSlice = (start, end) => {
                arr.oldSlice(start, end);
                localStorage.setItem(key, JSON.stringify(arr));
            };

            arr.oldSplice = arr.splice;
            const newSplice = (start, deleteCount, ...v) => {
                arr.oldSplice(start, deleteCount, ...v);
                localStorage.setItem(key, JSON.stringify(arr));
            };

            arr.push = newPush;
            arr.slice = newSlice;
            arr.splice = newSplice;
        };

        this.queNode = [];
        wrapperFunc('queNode', this.queNode);
        this.queEdge = [];
        wrapperFunc('queEdge', this.queEdge);
        this.queNodeRevision = [];
        wrapperFunc('queEdgeRevision', this.queNodeRevision);
        this.queEdgeRevision = [];
        wrapperFunc('queNodeRevision', this.queEdgeRevision);

        setInterval(() => this.attendQue(this.queNode, this.queEdge, this.queNodeRevision, this.queEdgeRevision), 10000);
    }

    /**
     *
     * @param {Node[]} queNode
     * @param {Edge[]} queEdge
     * @param {NodeRevision[]} queNodeRevision
     * @param {EdgeRevision[]} queEdgeRevision
     * @return {Promise<void>}
     */
    async attendQue(queNode, queEdge, queNodeRevision, queEdgeRevision) {
        while (queNode.length) {
            const queNodeElement = queNode[0];
            await this.persistNode(queNodeElement);
            queNodeElement.persisted = true;
            queNode.splice(0, 1);
        }
        while (queEdge.length) {
            const queEdgeElement = queEdge[0];
            await this.persistEdge(queEdgeElement);
            queEdgeElement.persisted = true;
            queEdge.splice(0, 1);
        }
        while (queNodeRevision.length) {
            const queNodeRevisionElement = queNodeRevision[0];
            await this.persistNodeRevision(queNodeRevisionElement);
            queNodeRevisionElement.persisted = true;
            queNodeRevision.splice(0, 1);
        }
        while (queEdgeRevision.length) {
            const queEdgeRevisionElement = queEdgeRevision[0];
            await this.persistEdgeRevision(queEdgeRevisionElement);
            queEdgeRevisionElement.persisted = true;
            queEdgeRevision.splice(0, 1);
        }
    }

    // Storage can be solved by observing array push, slice, etc
    // and then setting NODE/NODE_REVISION/EDGE/EDGE_REVISION localStorage keys to the array JSON'd

    // The tricky part is recalling, so that we must
    // Whenever we obtain nodes, we must compare our qued changes and check if they exist or not
    // The que'd changes will not have a uniqueId

    // HOW TO CHECK IF A LOCAL CHANGE HAS BEEN APPLIED YET, NO UID
    // I will have the predecessor identification, just use that, screw any sort of collision checking.

    // SOLUTION
    // On startup load all que'd changes to the interface, and add them to the que.  Apply them in the order they come in.

}

export const VERTICAL_LINEAR = 'VERTICAL_LINEAR';
export const VERTICAL_TREE = 'VERTICAL_TREE';
export const HORIZONTAL_TREE = 'HORIZONTAL_TREE';

/*
export class ViewportManager {
    constructor() {
        this.viewMode$ = new BehaviorSubject([]);
        this.centeredNode$ = new BehaviorSubject([]);
        this.nodes$ = new BehaviorSubject([]);
        this.rootNodeFilter$ = new BehaviorSubject((n) => true);

        this.viewMode$.subscribe(v => {
            switch (v) {
                case VERTICAL_LINEAR:
                    // apply a css class which makes nodes in a node container linear
                    break;
                case VERTICAL_TREE:
                    // apply a css class which makes nodes in a css class expand like a pyramid
                    break;
                case HORIZONTAL_TREE:
                    // apply the normal css class
                    break;
                default:
                    //  alert("Uknown view mode!");
                    return;
            }
        });
        this.rootNodeFilter$.subscribe(v => {

        });
        this.centeredNode$.subscribe(v => {

        });
    }

    /!**
     *
     * @param {function(node): bool} rootNodeFilter
     * @param {Node[]} nodes
     * @param {Node} centeredNode
     *!/
    setVisibleNodes(rootNodeFilter, nodes, centeredNode) {
        const rootNodes = nodes.filter(rootNodeFilter);
        if (!centeredNode) {
            centeredNode = rootNodes[0];
        }

        // Let's assume we can only see 6 steps await from our centeredNode
        const steps = 6;
        const visibleNodes = [];
        const setFunc = (n) => {
                visibleNodes.push(n);
            }
        ;
        const resetFunc = (n) => {

        };
    }

    /!**
     *
     * @param {function(node)} setFunc
     * @param {function(node)}resetFunc
     * @param {Node[]} nodes
     * @param {Node[]}toBeReset
     * @param {Node} nodeStart
     * @param {Number} steps
     *!/
    static walkPath(setFunc, resetFunc, nodes, toBeReset, nodeStart, steps) {
        toBeReset.map(n => {
            resetFunc(n);
            n.discovered = false;
            n.edges.map(e => e.used = false);
        });
        nodeStart.discovered = true;

        const discoveredNodes = [nodeStart];
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < discoveredNodes.length; j++) {
                const discoveredNode = discoveredNodes[j];
                if (discoveredNode.finished) continue;

                for (let k = 0; k < discoveredNode.edges.length; k++) {
                    const edge = discoveredNode.edges[k];

                    if (edge.used) continue;
                    edge.used = true;

                    if (!edge.nodeEnd.discovered) {
                        setFunc(discoveredNode);
                        discoveredNode.push(edge.nodeEnd);
                    }

                    if (discoveredNode.edges.every(e => e.used)) {
                        discoveredNode.finished = true;
                    }
                }
            }
        }
    }

    /!**
     * Shows every edge (relation) once, this may lead to duplicate nodes though.
     * I made this because I needed to see and modify all relations
     * @param nodes {Node[]}
     * @param edges {Edge[]}
     *!/
    static calculateAllRelations(nodes, edges) {
        // Mark all nodes as unused so we can find the ones we didn't use
        // Also show nodes we didn't touch, but I don't think that should happen because the edge revisions never got deleted
        const incompleteEdges = [];
        nodes.map(n => n.unused = true);
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            let n1;
            let n2;

            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                if (node.id === edge.n1) {
                    n1 = node;
                    node.unused = false;
                }
                if (node.id === edge.n2) {
                    n2 = node;
                    node.unused = false;
                }
            }

            // Add one to incomplete edge if we must
            if (!n1 || !n2) {
                incompleteEdges.push(edge);
            }

            if (n1) {
                n1.children.push(n2)
            }

            if (n2) {
                n2.predecessorNodes.push(n1);
            }
        }

        return incompleteEdges;
    }

    /!**
     *
     * @param nodes {Node[]}
     * @param edges {Edges[]}
     * @param newNode {Node}
     *!/
    static allRelationAddNode(nodes, edges, newNode) {

    }

    static allRelationAddEdge(nodes, edges, newEdge) {

    }


}*/

export class UserExperience {
    /**
     *
     * @param net {Net}
     */
    constructor(net) {
        this.net = net;
        this.userId = undefined;
        this.accessToken = undefined;
        this.email = undefined;
        this.capacityFraction = undefined;
    }

    static async isAuthenticated() {
        if (!localStorage.getItem('access_token')) {
            return false;
        }

        try {
            await axios.get(`${UrlUsers}/${this.userId}/Nodes`, {params: {filter: {limit: 0}}});
        } catch (e) {

            return false;
        }
        return true;
    }

    async getDefaultNet() {
        this.net.pushMessage("Getting default net");
        const result = await axios.get(resolveApiUrl(api, UrlDefaultUser), {params: {filter: netFilter}});
        this.setNetFromResult(result)
    }

    async getUserNet() {
        this.net.pushMessage("Getting user net");
        const result = await axios.get(resolveApiUrl(api, UrlUsers, localStorage.getItem(USER_ID)), {params: {filter: netFilter}});
        this.setNetFromResult(result)
    }

    async checkLoginGetNodes() {
        this.net.pushMessage("Checking login and getting nodes");
        const loggedIn = await UserExperience.isAuthenticated();
        if (loggedIn) {
            await this.getUserNet();
        } else {
            await this.getDefaultNet();
        }
        await sleep(1)
        // Now try and focus a node's element
    }

    static async login(email, password) {
        const result = await axios.post(resolveApiUrl(api, UrlUsers, 'login'), {email, password});
        UserExperience.setLoginResults(email, result.data.id, result.data.userId);
    }

    static async logout() {
        await axios.post(resolveApiUrl(api, UrlUsers, 'logout'));
    }

    setNetFromResult(result) {
        this.net.pushMessage("Setting net from results");
        if (!result || !result.data || !result.data.length) {
            this.net.pushMessage("Bad results, net will be set to empty");
            this.net.nodes = [];
            this.net.edges = [];
            return;
        }
        const user = result.data[0];

        const nodes = user.vNodes.map(o => new Node(o));
        const edges = user.edges.map(o => new Edge(o));
        // There should be a way to clear the net
        nodes.map(n => n.persisted = true);
        edges.map(n => n.persisted = true);
        this.net.addNodesAndEdges(nodes, edges);

    }

    /**
     *
     * @param {String} accessToken
     * @param {Number} userId
     * @param {String} email
     */
    static setLoginResults(accessToken, userId, email) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.email = email;
        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem(USER_ID, this.userId);
        axios.defaults.params['access_token'] = localStorage.getItem('access_token');
    }
}

