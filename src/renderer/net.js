import {BehaviorSubject, Subject} from 'rxjs';
import {debounceTime, scan} from 'rxjs/operators'
import axios from 'axios';
import * as $ from 'jquery';
import * as moment from 'moment';
import {flatten} from 'lodash';

export const LOADING_OBJECT_TIMEOUT = 10000;

const USER_ID = 'USER_ID';
const USER_EMAIL = 'USER_EMAIL';
const access_token = 'access_token';

export const api = 'api';
export const UrlUsers = 'Users';
export const UrlDefaultUser = 'DefaultUsers';
export const UrlNodes = 'Nodes';
export const UrlVNodes = 'VNodes';
export const UrlEdges = 'Edges';
export const UrlNodeRevisions = 'NodeRevisions';
export const UrlEdgeRevisions = 'EdgeRevisions';
export const UrlDefaultSourceNodes = 'DefaultSourceNodes';
export const UrlUserSourceNodes = 'SourceNodes';

const sourceNodeFilter = {
    include: [
        {
            relation: 'vNestedSetsGraphs',
            scope: {
                where: {lft: 1, text: {neq: null}, visible: true},
                order: ['sourceId DESC'],
                include: [
                    {
                        relation: 'vNode',
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
                ],
            }
        }
    ],
};
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
const nodeListFilter = {
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
                    },
                    {
                        relation: 'outgoingVEdge',
                        include: [
                            {
                                relation: 'edgeRevisions',
                                scope: {
                                    limit: 1,
                                    order: ['createdTimestamp DESC'],
                                },
                            }
                        ]
                    }
                ],
            },
        }
    ]
};
const singleNodeFilter = {
    include: [
        {
            relation: 'nodeRevisions',
            scope: {
                limit: 1,
                order: ['createdTimestamp DESC'],
            },
        }
    ]
};
// User ->
//  VNode WHERE id = $1
//      -> NestedSetsGraph WHERE nodeId = VNode AND lft > VNode ->
//          VNode -> VEdge
function nodesBelowFilter(nodeId) {
    return {
        include: [
            {
                relation: 'vNestedSetsGraphs',
                scope: {
                    where: {nodeId},
                    include: [
                        {
                            relation: 'vNestedSetsGraphMates',
                            scope: {
                                where: {visible: true},
                                include: [
                                    {
                                        relation: 'vNode',
                                        scope: {
                                            where: {visible: true},
                                            order: ['lastModified DESC'],
                                            include: [
                                                {
                                                    relation: 'nodeRevisions',
                                                    scope: {
                                                        limit: 1,
                                                        order: ['createdTimestamp DESC'],
                                                    },
                                                },
                                                {
                                                    relation: 'incomingVEdges',
                                                    scope: {
                                                        include: [
                                                            {
                                                                relation: 'edgeRevisions',
                                                                scope: {
                                                                    limit: 1,
                                                                    order: ['createdTimestamp DESC'],
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                                {
                                                    relation: 'outgoingVEdges',
                                                    scope: {
                                                        include: [
                                                            {
                                                                relation: 'edgeRevisions',
                                                                scope: {
                                                                    limit: 1,
                                                                    order: ['createdTimestamp DESC'],
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        ]
    }
}

// In order to get the nodes below we need two things
// First our entry in the NestedSetsGraph
// Second all the nodes between the lft and rgt values

/**
 * @param n {Edge}
 */
export function sanitizeLoadedEdge(n) {
    n.persisted = true;
    n.edgeRevisions$.getValue().map(r => {
        r.persisted = true;
    });
}

/**
 * @param n {Node}
 */
export function sanitizeLoadedNode(n) {
    n.persisted = true;
    n.nodeRevisions$.getValue().map(r => {
        r.persisted = true;
    });
}

class gen_Edge {
    constructor({id, createdTimestamp, userId}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
    }
}

class gen_EdgeRevision {
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

class gen_NestedSetsGraph {
    constructor({sourceId, nodeId, lft, rgt, lastModified, id}) {
        this.sourceId = !isNaN(parseInt(sourceId + '', 10)) ? parseInt(sourceId + '', 10) : undefined;
        this.nodeId = !isNaN(parseInt(nodeId + '', 10)) ? parseInt(nodeId + '', 10) : undefined;
        this.lft = !isNaN(parseInt(lft + '', 10)) ? parseInt(lft + '', 10) : undefined;
        this.rgt = !isNaN(parseInt(rgt + '', 10)) ? parseInt(rgt + '', 10) : undefined;
        this.lastModified = lastModified ? new Date(lastModified) : undefined;
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
    }
}

class gen_Node {
    constructor({id, createdTimestamp, userId}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
    }
}

class gen_NodeRevision {
    constructor({id, createdTimestamp, text, classification, nodeId, visible}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.text = text;
        this.classification = classification;
        this.nodeId = !isNaN(parseInt(nodeId + '', 10)) ? parseInt(nodeId + '', 10) : undefined;
        this.visible = visible;
    }
}

class gen_VEdge {
    constructor({id, visible, classification, createdTimestamp, n1, n2, text}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.visible = visible;
        this.classification = classification;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.n1 = !isNaN(parseInt(n1 + '', 10)) ? parseInt(n1 + '', 10) : undefined;
        this.n2 = !isNaN(parseInt(n2 + '', 10)) ? parseInt(n2 + '', 10) : undefined;
        this.text = text;
    }
}

class gen_VEdgeRevision {
    constructor({id, createdTimestamp, text, classification, assignedTo, n1, n2, visible}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.text = text;
        this.classification = classification;
        this.assignedTo = !isNaN(parseInt(assignedTo + '', 10)) ? parseInt(assignedTo + '', 10) : undefined;
        this.n1 = !isNaN(parseInt(n1 + '', 10)) ? parseInt(n1 + '', 10) : undefined;
        this.n2 = !isNaN(parseInt(n2 + '', 10)) ? parseInt(n2 + '', 10) : undefined;
        this.visible = visible;
    }
}

class gen_VNestedSetsGraph {
    constructor({sourceId, nodeId, lft, rgt, id, lastModified, text, userId}) {
        this.sourceId = !isNaN(parseInt(sourceId + '', 10)) ? parseInt(sourceId + '', 10) : undefined;
        this.nodeId = !isNaN(parseInt(nodeId + '', 10)) ? parseInt(nodeId + '', 10) : undefined;
        this.lft = !isNaN(parseInt(lft + '', 10)) ? parseInt(lft + '', 10) : undefined;
        this.rgt = !isNaN(parseInt(rgt + '', 10)) ? parseInt(rgt + '', 10) : undefined;
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.lastModified = lastModified ? new Date(lastModified) : undefined;
        this.text = text;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
    }
}

class gen_VNode {
    constructor({id, createdTimestamp, userId, lastModified, visible, text}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.userId = !isNaN(parseInt(userId + '', 10)) ? parseInt(userId + '', 10) : undefined;
        this.lastModified = lastModified ? new Date(lastModified) : undefined;
        this.visible = visible;
        // temporarily removing this
        /*        this.text = text;*/
    }
}

class gen_VNodeRevision {
    constructor({id, createdTimestamp, text, classification, assignedTo, visible}) {
        this.id = !isNaN(parseInt(id + '', 10)) ? parseInt(id + '', 10) : undefined;
        this.createdTimestamp = createdTimestamp ? new Date(createdTimestamp) : undefined;
        this.text = text;
        this.classification = classification;
        this.assignedTo = !isNaN(parseInt(assignedTo + '', 10)) ? parseInt(assignedTo + '', 10) : undefined;
        this.visible = visible;
    }
}

export const SMALL_NODE = 'SMALL_NODE';
export const MEDIUM_NODE = 'MEDIUM_NODE';
export const LARGE_NODE = 'LARGE_NODE';

export const QUESTION_ANSWER = 'QUESTION_ANSWER';
export const RAMBLE = 'RAMBLE';
export const TUTORIAL = 'TUTORIAL';

export class Node extends gen_VNode {
    constructor(o) {
        super(o);
        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.predecessorNodes$ = new BehaviorSubject([]);
        /**
         * True if successor nodes are present
         * @type {boolean}
         */
        this.loading = false;
        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.successorNodes$ = new BehaviorSubject([]);
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

        /**
         * If there are potentially unloaded children of this node
         * @type {BehaviorSubject<Boolean>}
         */
        this.childrenLoaded$ = new BehaviorSubject(false);

        /**
         * If the UI is expanded
         * @type {BehaviorSubject<boolean>}
         */
        this.expanded$ = new BehaviorSubject(false);

        this.persisted = false;

        /**
         * The total number of children we have, currently only used when the node is a source
         * @type {number}
         */
        this.childCount = 0;

        this.sizeClassification$ = new BehaviorSubject(MEDIUM_NODE);
        const setSizeClass = (r) => {
            const len = r.length || 0;
            if (len < 50) {
                this.sizeClassification$.next(SMALL_NODE);
            } else if (len < 250) {
                this.sizeClassification$.next(MEDIUM_NODE);
            } else {
                this.sizeClassification$.next(LARGE_NODE);
            }
        };
        setSizeClass(this.currentText$.getValue());
        this.currentText$.pipe(debounceTime(3000)).subscribe(setSizeClass);

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
        const edges = this.net.edges$.getValue();
        const successorEdges = edges.filter(e => e.n1 === this.id);
        const predecessorEdges = edges.filter(e => e.n2 === this.id);
        this.successorEdges$.next(successorEdges);
        this.predecessorEdges$.next(predecessorEdges);
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
        const successorEdges = this.successorEdges$.getValue();
        const predecessorEdges = this.predecessorEdges$.getValue();
        const nodes = this.net ? this.net.nodes$.getValue() : [];

        // Assign the nodeStart and nodeEnd for each of these, though I forget where these are used
        successorEdges.forEach(e => {
            e.nodeStart = nodes.find(n => n.id === e.n1);
            e.nodeEnd = nodes.find(n => n.id === e.n2);
        });

        // Assign the nodeStart and nodeEnd for each of these, though I forget where these are used
        predecessorEdges.forEach(e => {
            e.nodeStart = nodes.find(n => n.id === e.n1);
            e.nodeEnd = nodes.find(n => n.id === e.n2);
        });

        // Our successor nodes are those who are on the other end of our successor edges.
        const successorNodes = nodes.filter(n =>
            successorEdges.find(e => e.n2 === n.id)
        );

        // Our predecessor nodes are those who are on the other end of our predecessor edges
        const predecessorNodes = nodes.filter(n =>
            predecessorEdges.find(e => e.n1 === n.id)
        );

        this.successorNodes$.next(successorNodes);
        this.predecessorNodes$.next(predecessorNodes);
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

    async expand() {
        if (this.expanding) {
            return;
        }
        if (this.expanded$.getValue()) {
            this.expanded$.next(false);
        } else {
            if (this.childrenLoaded$.getValue()) {
                this.expanded$.next(true);
            } else {
                let url;
                if (this.net.userExperience.isAuthenticated$.getValue()) {
                    url = resolveApiUrl(api, UrlUsers, this.userExperience.userId);
                } else {
                    url = resolveApiUrl(api, UrlDefaultUser);
                }

                this.expanding = true;
                await this.net.userExperience.loadNodeDescendantsIntoNet(this, url);
                this.expanding = false;
                this.childrenLoaded$.next(true);
                this.expanded$.next(true)
            }
        }
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

        this.persisted = persisted;
        this.m_createdTimestamp = this.createdTimestamp && moment(this.createdTimestamp);
    }
}

export class Edge extends gen_VEdge {
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

export class SourceNode extends Node {
    constructor(o) {
        super(o);
        this.count = o.count;

    }
}

/**
 *
 * @param n {number}
 * @return {Promise<void>}
 */
export function sleep(n) {
    return new Promise((resolve) => {
        setTimeout(resolve, n);
    });
}

export function resolveApiUrl(...args) {
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
    el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
    });
    // TODO figure out how to scroll only the inside container
    $('#root-container').animate({scrollTop: $(el).offset().top - ($(window).height() - $(el).outerHeight(true)) / 2}, 200);
    const boundingRect = el.getBoundingClientRect();
    const xCenter = boundingRect.left + (boundingRect.width / 2);
    const yCenter = boundingRect.top + (boundingRect.height / 2);
/*    document.getElementById('root-container').scroll({
        left: xCenter,
        top: yCenter,
        behavior: "smooth",
    });*/

    if (event) {
        event.stopPropagation();

        event.preventDefault();
    }

    newInstance.showTextArea();
    newInstance.$refs.textarea.focus();
    net.removePreEditingNode();
    net.setPreEditingNode(newInstance.node);
    net.groupSelectedNodes$.next([newInstance.node]);
}

export function scrollUpElement(el) {
    $(el).animate({scrollTop: 0}, "fast");
}

export class Net {
    /**
     * @param {Node[]} nodes
     * @param {Edge[]} edges
     * @param {RequestHandler} db
     */
    constructor(nodes, edges, db) {
        /**
         * @type {UserExperience}
         */
        this.userExperience = undefined;

        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.nodes$ = new BehaviorSubject([]);
        /**
         *
         * @type {BehaviorSubject<Edge[]>}
         */
        this.edges$ = new BehaviorSubject([]);
        /**
         * @type {RequestHandler}
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
            const predecessorEdges = n.predecessorEdges$.getValue();
            return predecessorEdges.length === 0;
        };

        this.recomputeDisplaySignal$ = new Subject();
        this.recomputeRelationSignal$ = new Subject();

        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.groupSelectedNodes$ = new BehaviorSubject([]);
        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.preEditSelectedNodes$ = new BehaviorSubject([]);
        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.editSelectedNodes$ = new BehaviorSubject([]);


        /**
         * @type {BehaviorSubject<Node[]>}
         */
        this.displayRootNodes$ = new BehaviorSubject([]);

        /**
         * @type {BehaviorSubject<void>}
         */
        this.recomputeDisplaySignal$.subscribe(() => {
            const nodes = this.nodes$.getValue();
            this.pushMessage("Recaculating displayRootNodes with node length: " + nodes.length);
            this.displayRootNodes$.next(nodes.filter(this.rootNodeFilter));
        });

        /**
         * @type {Map<Vue, Node>}
         */
        this.nodeElementMap = new Map();

        /*        this.viewportManager = new ViewportManager();*/

        // Take care of the transformation which needs to happen when we apply different kinds of selections to nodes
        // HACK I don't think I should be relying on scan for side effects here
        this.preEditSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
            // this.pushMessage("Pre edit selected nodes changed");
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
                n.vueInstances.map(v => v.showMarkdown());
                n.expand();
            };
            previousNodes.map(previousFunc);
            newNodes.map(newFunc);
            return newNodes;
        })).subscribe();
        this.editSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
            // this.pushMessage("Edit selected nodes changed");
            /**
             *
             * @param n {Node}
             */
            const previousFunc = (n) => {
                n.editSelected$.next(false);
                n.vueInstances.map(v => {
                    v.showMarkdown();
                    v.scrollUpMarkdown();
                });
            };
            /**
             *
             * @param n {Node}
             */
            const newFunc = (n) => {
                n.preEditSelected$.next(false);
                n.editSelected$.next(true);
                n.vueInstances.map(v => {
                    v.showTextArea();
                });
                n.expand();
            };
            previousNodes.map(previousFunc);
            newNodes.map(newFunc);
            return newNodes;
        })).subscribe();
        this.groupSelectedNodes$.pipe(scan((previousNodes, newNodes) => {
            // this.pushMessage("Group selected nodes got changed");
            /**
             *
             * @param n {Node}
             */
            const previousFunc = (n) => {
                n.groupSelected$.next(false);
                n.vueInstances.map(v => v.showMarkdown());
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

        this.addNodesAndEdges(nodes, edges);
    }

    /**
     * @param newNodes {Node[]}
     * @param newEdges {Edge[]}
     */
    addNodesAndEdges(newNodes, newEdges) {
        // Added this check to find out where duplicate Ids are inserted
        if (newNodes.find(n => this.nodes$.getValue().find(n2 => n2.id === n.id))) {
            throw 'Duplicate Id found';
        }
        this.messages$.next(this.messages$.getValue('Adding nodes and edges'));
        const oldNodes = this.nodes$.getValue();
        const oldEdges = this.edges$.getValue();
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

        this.nodes$.next(oldNodes);
        this.edges$.next(oldEdges);

        for (let i = 0; i < oldNodes.length; i++) {
            const oldNode = oldNodes[i];
            oldNode.checkEdgeRevisions();
        }

        this.recomputeRelationSignal$.next();
        this.recomputeDisplaySignal$.next();
    }

    clear() {
        this.nodes$.next([]);
        this.edges$.next([]);
        this.recomputeRelationSignal$.next();
        this.recomputeDisplaySignal$.next();
    }

    /**
     * This is what happens when you click on a node,
     * erases everyone and just selects one
     * @param n {Node}
     */
    setEditingNode(n) {
        // this.pushMessage('Setting editing node');
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

    removePreEditingNode() {
        // this.pushMessage('Removing pre-editing node');
        this.preEditSelectedNodes$.getValue().map(n => n.preEditSelected$.next(false));
    }

    /**
     * @param parentInstance {Vue}
     */
    async createNode(parentInstance) {
        const groupSelectedNodes = this.groupSelectedNodes$.getValue();
        this.pushMessage("Creating node with " + groupSelectedNodes.length + " parents");

        /**
         * @type {Node}
         */
        /*        const parentNode = parentInstance.node;
                const parentVueInstanceIndex = parentNode.vueInstances.findIndex(v => v.node.id === parentInstance.node.id);*/
        const newNode = await this.db.newNode({});
        // Here I dangerously assume that all nodes coming from the server will have a revision, which is done in an operation hook.
        newNode.nodeRevisions$.getValue()[0].visible = true;
        const newEdges = [];
        for (let i = 0; i < groupSelectedNodes.length; i++) {
            const groupSelectedNode = groupSelectedNodes[i];
            const newEdge = await this.db.newEdge({});
            const newRevision = await this.db.newEdgeRevision(
                new gen_EdgeRevision({n1: groupSelectedNode.id, n2: newNode.id, edgeId: newEdge.id}));
            newRevision.visible = true;


            newEdge.edgeRevisions$.next([newRevision]);
            newEdges.push(newEdge);
        }
        this.addNodesAndEdges([newNode], newEdges);
        // Create the new node, push it into the net, wait for the DOM to update the vue instances and then find the vue instance we're focusing
        await sleep(100);
        let newInstance;
        const keys = this.nodeElementMap.keys();
        for (let i of keys) {
            if (i.node.id === newNode.id) {
                newInstance = i;
                break;
            }
        }
        if (newInstance) {
            setFocusedInstance(this, parentInstance, newInstance);
        }
        // setFocusedInstance(childInstance);
        // Maybe I should reset the focuses and add the new, focused instance to preEditSelected$
    }

    /**
     * @param i {any}
     */
    pushMessage(i) {
        console.log(i);
        this.messages$.next(this.messages$.getValue().concat(i));
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
        if (vueInstance) {
            siblingInstances = vueInstance.$children;
        }
        let myIndex = siblingInstances.indexOf(vueInstance);

        const viewMode = this.userExperience.nodeLayout$.getValue();
        /*        const selectedNodes = this.groupSelectedNodes$.getValue();*/
        switch (event.key) {
            // CTRL+e is the hotkey to erase a node
            // CTRL+o is the hotkey to create a fake loading object
            case "o":
                if (event.ctrlKey) {
                    const o = this.db.loadingObjectList.newLoadingObject("TEST LOADING OBJECT");
                    setTimeout(() => {
                        o.resolve();
                    }, 20000)
                }
                break;
            case "e":
                if (event.ctrlKey) {
                    this.addNodeHideToQue([node]);
                }
                break;
            case "Enter":
                this.pushMessage('Enter pressed, createNode');
                // If there aren't any nodes selected create a root node
                await this.createNode(undefined);
                break;
            case "Escape":
                // If you pressed escape then de-select all nodes;
                this.pushMessage('Escape pressed, unselecting all');
                this.groupSelectedNodes$.next([]);
                this.editSelectedNodes$.next([]);
                this.setPreEditingNode(node);
                break;
            case "ArrowLeft":
                // TODO add a check for view mode here
                switch (viewMode) {
                    case HORIZONTAL_TREE:
                        this.selectParentNode(vueInstance);
                        break;
                    case VERTICAL_TREE, SOURCE_LIST:
                        this.selectAboveSibling(siblingInstances, vueInstance, myIndex, newInstance);


                        break;
                }
                break;
            case "ArrowRight":
                switch (viewMode) {
                    case HORIZONTAL_TREE:
                        this.selectChild(vueInstance);
                        break;
                    case VERTICAL_TREE, SOURCE_LIST:
                        this.selectBelowSibling(siblingInstances, vueInstance, myIndex, newInstance);
                        break;
                }
                break;
            case "ArrowUp":
                // TODO add a check for view mode here
                switch (viewMode) {
                    case HORIZONTAL_TREE:
                        this.selectAboveSibling(siblingInstances, vueInstance, myIndex, newInstance);
                        break;
                    case VERTICAL_TREE, SOURCE_LIST:
                        this.selectParentNode(vueInstance);
                        break;
                }
                break;
            case "ArrowDown":
                // TODO add a check for view mode here
                siblingInstances = vueInstance.$parent.$children.filter(v => v.node && v.node.visible);
                switch (viewMode) {
                    case HORIZONTAL_TREE:
                        this.selectBelowSibling(siblingInstances, vueInstance, myIndex, newInstance);
                        break;
                    case VERTICAL_TREE, SOURCE_LIST:
                        this.selectChild(vueInstance);
                        break;
                }
                break;
        }
    }

    selectBelowSibling(siblingInstances, vueInstance, myIndex, newInstance) {
        siblingInstances = vueInstance.$parent.$children.filter(v => v.node && v.node.visible);
        // If there is only one sibling then that sibling is us and we should return
        if (siblingInstances.length === 1) {
            return;
        }
        for (let i = 0; i < siblingInstances.length; i++) {
            const siblingInstance = siblingInstances[i];
            if (siblingInstance === vueInstance) {
                myIndex = i;
            }
        }
        // Once we have
        /*                    if (myIndex === -1) {
                                alert("Could not find self in parent's successorNodes handling ArrowDown");
                                return;
                            }*/
        // myIndex = siblingRefs.findIndex((r) => .isSameNode(r));
        if (myIndex === (siblingInstances.length - 1)) {
            myIndex = 0;
        } else {
            myIndex++;
        }
        newInstance = siblingInstances[myIndex];
        setFocusedInstance(this, vueInstance, newInstance);
        return;
    }

    selectAboveSibling(siblingInstances, vueInstance, myIndex, newInstance) {
        siblingInstances = vueInstance.$parent.$children.filter(v => v.node && v.node.visible);
        // If there is only one sibling then that sibling is us and we should return
        if (siblingInstances.length === 1) {
            return;
        }
        for (let i = 0; i < siblingInstances.length; i++) {
            const siblingInstance = siblingInstances[i];
            if (siblingInstance === vueInstance) {
                myIndex = i;
            }
        }
        // If we have no siblings than we can't go up
        // Once we have
        /*                if (myIndex === -1) {
                            alert("Could not find self in parent's successorNodes handling ArrowDown");
                            return;
                        }*/
        // myIndex = siblingRefs.findIndex((r) => .isSameNode(r));
        if (myIndex === 0) {
            myIndex = siblingInstances.length - 1;
        } else {
            myIndex--;
        }
        newInstance = siblingInstances[myIndex];
        setFocusedInstance(this, vueInstance, newInstance);
        return {siblingInstances, myIndex, newInstance};
    }

    selectChild(vueInstance) {
        let children = vueInstance.$children.filter(v => v.node && v.node.visible);
        let childrenLength = children.length;
        if (childrenLength) {
            let i = childrenLength % 2 ?
                (childrenLength / 2) + 0.5 - 1 :
                childrenLength / 2;

            setFocusedInstance(this, vueInstance, children[i]);
        }
    }

    selectParentNode(vueInstance) {
        let parent = vueInstance.$parent;
        if (parent.node) {
            setFocusedInstance(this, vueInstance, parent);
        }
    }

    /**
     *
     * @param nodes {Node[]}
     * @return {Promise<void>}
     */
    async addNodeHideToQue(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            /**
             * @type {NodeRevision}
             */
            const latestRevision = node.latestRevision$.getValue();
            latestRevision.visible = false;
            const o = new gen_NodeRevision(latestRevision);
            delete o.createdTimestamp;
            this.db.queNodeRevision.push(new NodeRevision(o));
            // await this.db.newNodeRevision(o);
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
        const newNode = await this.db.newNode();
        const newNodeRevision = await this.db.newNodeRevision(
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
                const edge = await this.db.newEdge({});
                const revision = await this.db.newEdgeRevision(
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

export class LoadingObjectList {
    constructor() {
        /**
         *
         * @type {LoadingObject[]}
         */
        this.loadingObjects = [];
    }

    /**
     * @param text
     * @return {LoadingObject}
     */
    newLoadingObject(text) {
        const n = new LoadingObject(text, this);
        this.loadingObjects.push(n);
        return n;
    }
}

export class LoadingObject {
    /**
     *
     * @param text {String}
     * @param objectList {LoadingObjectList}
     */
    constructor(text, objectList) {
        this.text = text;
        this.objectList = objectList;
    }

    resolve(i) {
        this.text = i ?
            this.text + " " + i :
            this.text + " success";
        setTimeout(() => {
            this.removeSelf();
        }, LOADING_OBJECT_TIMEOUT)
    }

    reject(e) {
        this.text = this.text + " failed: " + e;
        setTimeout(() => {
            this.removeSelf();
        }, LOADING_OBJECT_TIMEOUT)
    }

    removeSelf() {
        const i = this.objectList.loadingObjects.indexOf(this);
        if (i >= 0) {
            this.objectList.loadingObjects.splice(i, 1);
        }
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

export class RequestHandler {
    /**
     * @param {NodePersistor} persistNode
     * @param {EdgePersistor} persistEdge
     * @param {NodeRevisionPersistor} persistNodeRevision
     * @param {EdgeRevisionPersistor} persistEdgeRevision
     * @param localstorageKey {String}
     */
    constructor(persistNode, persistEdge, persistNodeRevision, persistEdgeRevision, localstorageKey, errorHandlingFunc) {
        /*        this.persistNode = persistNode;
                this.persistEdge = persistEdge;
                this.newNodeRevision = newNodeRevision;
                this.newEdgeRevision = newEdgeRevision;*/
        this.errorHandlingFunc = errorHandlingFunc;

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

        setInterval(() => this.attendQue(this.queNode, this.queEdge, this.queNodeRevision, this.queEdgeRevision), 5000);

        /**
         * @type {LoadingObjectList}
         */
        this.loadingObjectList = new LoadingObjectList();
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
            await this.newNode(queNodeElement).catch(this.errorHandlingFunc);
            queNodeElement.persisted = true;
            queNode.splice(0, 1);
        }
        while (queEdge.length) {
            const queEdgeElement = queEdge[0];
            await this.newEdge(queEdgeElement);
            queEdgeElement.persisted = true;
            queEdge.splice(0, 1);
        }
        while (queNodeRevision.length) {
            const queNodeRevisionElement = queNodeRevision[0];
            await this.newNodeRevision(queNodeRevisionElement).catch(this.errorHandlingFunc);
            queNodeRevisionElement.persisted = true;
            queNodeRevision.splice(0, 1);
        }
        while (queEdgeRevision.length) {
            const queEdgeRevisionElement = queEdgeRevision[0];
            await this.newEdgeRevision(queEdgeRevisionElement).catch(this.errorHandlingFunc);
            queEdgeRevisionElement.persisted = true;
            queEdgeRevision.splice(0, 1);
        }
    }

    /**
     * @param node
     * @return {Promise<Node>}
     */
    async newNode(node) {
        const o = this.loadingObjectList.newLoadingObject("Creating new node");
        let result;

        try {
            result = await axios.post(resolveApiUrl(api, UrlNodes), new gen_Node(node));
            // Since we're creating a node we are definitely not
            result = await axios.get(resolveApiUrl(api, UrlVNodes, result.data.id), {params: {filter: singleNodeFilter}});
            o.resolve();
        } catch (e) {
            o.reject(e);
            throw e;
        }
        return new Node(result.data);
    }

    /**
     * @param {Edge} edge
     * @return {Promise<Edge>}
     */
    async newEdge(edge) {
        const o = this.loadingObjectList.newLoadingObject("Creating new edge");
        let returned;
        let result;
        try {
            returned = await axios.post(resolveApiUrl(api, UrlEdges), new gen_Edge(edge));
            result = await axios.get(resolveApiUrl(api, UrlEdges, returned.data.id + ''));
            o.resolve();
        } catch (e) {
            o.reject(e);
            throw e;
        }
        return new Edge(result.data);
    }

    /**
     *
     * @param {NodeRevision} nodeRevision
     * @return {Promise<NodeRevision>}
     */
    async newNodeRevision(nodeRevision) {
        // If there is an id, delete it
        const o = this.loadingObjectList.newLoadingObject("Creating node revision");
        let result;
        let newNodeRevision;
        let revision;
        try {
            delete nodeRevision.id;
            result = await axios.post(resolveApiUrl(api, UrlNodeRevisions), new gen_NodeRevision(nodeRevision));
            newNodeRevision = await axios.get(
                resolveApiUrl(api,
                    UrlUsers,
                    localStorage.getItem(USER_ID),
                    'Nodes',
                    nodeRevision.nodeId + '',
                    'NodeRevisions',
                    result.data.id + '',
                ));

            revision = new NodeRevision(newNodeRevision.data);
            revision.persisted = true;
            o.resolve();
        } catch (e) {
            console.log(e);
            o.reject(e);
            throw e;
        }
        return revision;
    }

    /**
     *
     * @param {gen_EdgeRevision} edgeRevision
     * @return {Promise<EdgeRevision>}
     */
    async newEdgeRevision(edgeRevision) {
        const o = this.loadingObjectList.newLoadingObject("Creating edge revision");
        let result;
        let revisitionResult;
        try {
            result = edgeRevision.id ?
                await axios.put(resolveApiUrl(api, UrlEdgeRevisions, edgeRevision.id + '')) :
                await axios.post(resolveApiUrl(api, UrlEdgeRevisions), edgeRevision);
            revisitionResult = await axios.get(
                resolveApiUrl(api, UrlUsers,
                    localStorage.getItem(USER_ID),
                    UrlEdges,
                    edgeRevision.edgeId + '',
                    UrlEdgeRevisions,
                    result.data.id + ''));
            o.resolve();
        } catch (e) {
            o.reject(e);
            throw e;
        }


        return new EdgeRevision(revisitionResult.data);
    }

    async loadSourceList() {
        // Join userId -> VNestedSetGraph -> VNodes
        // TODO add UserId to VNestedSetGraph DONE
        // TODO refind the model discovery script from books, or maybe copy the one from production-api
        // TODO add nested remoting to VNestedSetGraph
    }

    /**
     *
     * @param n {SourceNode}
     * @return {Promise<void>}
     */
    async loadSuccessorNodes(n) {
        // Select all members of this tree joined on VNodes
    }

    /**
     *
     * @param n {Number}
     * @return {Promise<Node[]>}
     * @constructor
     */
    async LoadMostRecentNodes(n) {
        const o = this.loadingObjectList.newLoadingObject(`Loading ${n} most recent nodes`);
        try {
            const result = await axios.get(resolveApiUrl(api, UrlUsers, this.userId), {params: {filter: nodeListFilter}});
            if (!result || !result.data) {
                o.reject("No result data!")
                return [];
            }
            const user = result.data.length ?
                result.data[0] :
                result.data;

            /**
             * @type {Node[]}
             */
            const nodes = user.vNodes.map(o => new Node(o));
            /**
             * @type {Edge[]}
             */
            nodes.map(sanitizeLoadedNode);
            return nodes;

        } catch (e) {

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

export const VERTICAL_TREE = 'VERTICAL_TREE';
export const HORIZONTAL_TREE = 'HORIZONTAL_TREE';
export const SOURCE_LIST = 'SOURCE_LIST';

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

export class User {
    constructor({displayName, id, token}) {
        this.displayName = displayName;
        this.id = id;
        this.token = token;
    }


    /**
     *
     * @param o
     * @return {User}
     */
    static getUserFromResults(o) {
        // So the data will arrive in the form of {...., UserIdentity: {
        //    credentials: {accessToken: 'askldjf'},
        //    profile: {displayName: 'Marvin Irwin'}}
        // }
        // }

        // Ok so I have an accessToken in the userIdentity model,
        // is that my accessToken for google or for loopback?
        // Also, how do I get the access token,
        // because I don't have a traditional login method.
        // Is it stored inside of the url or something?

        // TODO 1. Check if the access token in the userIdentity credentials thing is my thing.
        // TODO 2. It's not, but that's fine I guess I just need to know where my accessToken is sent to me, let's try the authenticate with google button again

        const userIdentity = o.userIdentity;
        const profile = o.profile;
        return new User({displayString: profile.displayName, id: o.id, token: userIdentity.access()})
    }
}

export const DefaultUser = new User({displayString: 'Default User', id: 22, token: ''});

export class UserExperience {
    static getCookie(cname) {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    /**
     *
     * @param net {Net}
     * @param loadingObjectList {LoadingObjectList}
     */
    constructor(net, loadingObjectList) {
        // Perform the cookie -> localStorage swap
        if (UserExperience.getCookie('access_token') &&
            UserExperience.getCookie('userId')) {
            localStorage.setItem(access_token, UserExperience.getCookie('access_token'));
            localStorage.setItem(USER_ID, UserExperience.getCookie('userId'));
        }
        this.net = net;
        this.loadingObjectList = loadingObjectList;
        this.capacityFraction = undefined;
        /**
         *
         * @type {Subject<String>}
         */
        this.message$ = new BehaviorSubject('');
        this.nodeLayout$ = new BehaviorSubject(SOURCE_LIST);
        this.isAuthenticated$ = new BehaviorSubject(false);
        this.authenticationInProgress = false;

        /**
         * @type {BehaviorSubject<User>}
         */
        this.user$ = new BehaviorSubject(null);
        (async () => {
            this.isAuthenticated$.next(await this.checkAuthenticated());
        })();

        this.user$.subscribe(async u => {
            await this.waitAuthentication();
            await this.checkLoginGetSourceNodes();
        });
    }

    waitAuthentication() {
        let i;
        return new Promise((resolve, reject) => {
            i = setInterval(() => {
                if (!this.authenticationInProgress) {
                    resolve();
                    // TODO figure out how to stop setInterval
                    // TODO maybe add a timeout?
                    // removeInterval(i);
                }
            }, 100)
        });
    }

    get accessToken() {
        return localStorage.getItem(access_token);
    }

    set accessToken(v) {
        localStorage.setItem(access_token, v);
    }

    get email() {
        return localStorage.getItem(USER_EMAIL);
    }

    set email(v) {
        localStorage.setItem(USER_EMAIL, v);
    }

    get userId() {
        return localStorage.getItem(USER_ID);
    }

    set userId(v) {
        localStorage.setItem(USER_ID, v);
    }

    pushMessage(m) {
        this.message$.next(m);
    }

    /**
     * @return {Promise<boolean>}
     */
    async checkAuthenticated() {
        if (!this.accessToken) {
            return false;
        }
        let o;
        this.authenticationInProgress = true;
        try {
            o = this.loadingObjectList.newLoadingObject("Checking if you're logged in");
            await axios.get(resolveApiUrl(api, UrlUsers, this.userId, 'nodes'), {params: {filter: {limit: 0}}});
            o.resolve("User is logged in!");
        } catch (e) {
            o.reject(e);
            return false;
        }
        this.authenticationInProgress = false;
        return true;
    }

    async getDefaultNet() {
        this.net.clear();
        this.net.pushMessage("Getting default net");
        const result = await
            axios.get(resolveApiUrl(api, UrlDefaultUser), {params: {filter: netFilter}});
        this.loadNodesAndEdgeResultIntoNet(result)
    }

    async getUserNet() {
        this.net.clear();
        this.net.pushMessage("Getting user net");
        const result = await
            axios.get(resolveApiUrl(api, UrlUsers, this.userId), {params: {filter: netFilter}});
        this.loadNodesAndEdgeResultIntoNet(result)
    }

    /**
     * So the query would be
     * Select * from v_nested_sets_graph WHERE lft = 1 AND visible = true
     * Then join on how many
     */

    /**
     * These should load all source nodes as well as their usage statistics
     * @return {Promise<void>}
     */
    async getDefaultSourceNodes() {
        const result = await
            axios.get(resolveApiUrl(api, UrlDefaultUser), {params: {filter: sourceNodeFilter}});
        this.loadSourceNodesIntoNet(result);
    }

    /**
     * These should load all source nodes as well as their usage statistics
     * @return {Promise<void>}
     */
    async getUserSourceNodes() {
        const result = await
            axios.get(resolveApiUrl(api, UrlUsers, this.userId), {params: {filter: sourceNodeFilter}});
        this.loadSourceNodesIntoNet(result);
    }

    async checkLoginGetNodes() {
        this.net.pushMessage("Checking login and getting nodes");
        const loggedIn = this.isAuthenticated$.getValue();
        if (loggedIn) {
            this.pushMessage("Querying your net...");
            await
                this.getUserNet();
        } else {
            this.pushMessage("Not logged in, loading default network...");
            await
                this.getDefaultNet();
        }
        await
            sleep(1)
        // Now try and focus a node's element
    }

    /**
     *
     * @return {Promise<void>}
     */
    async checkLoginGetSourceNodes() {
        this.net.pushMessage("Checking login and getting nodes");
        const loggedIn = this.isAuthenticated$.getValue();
        if (loggedIn) {
            this.pushMessage("Querying your net...");
            await
                this.getUserSourceNodes();
        } else {
            this.pushMessage("Not logged in, loading default network...");
            await
                this.getDefaultSourceNodes();
        }
    }

    async login(email, password) {
        let o;
        try {
            o = this.loadingObjectList.newLoadingObject("Logging in " + email);
            const result = await
                axios.post(resolveApiUrl(api, UrlUsers, 'login'), {email, password});
            this.setLoginResults(result.data.id, result.data.userId, email);
            o.resolve("Successfully logged in");
        } catch (e) {
            o.reject(e);
        }
    }

    async logout() {
        let o;
        try {
            o = this.loadingObjectList.newLoadingObject("Attempting to log out");
            if (!this.accessToken) {
                o.reject("Already logged out, no action needed");
                return
            }
            await
                axios.post(resolveApiUrl(api, UrlUsers, 'logout'));
            o.resolve("Logging out successful")
        } catch (e) {
            o.reject(e);
        }
        this.net.clear();
        this.email = "";
        this.userId = "";
        this.accessToken = "";
        this.isAuthenticated$.next(false);
        this.user$.next(null);
    }

    loadSourceDescendantsIntoNet(result) {
        if (!result || !result.data) {
            this.net.nodes$.next([]);
            return;
        }
        const user = result.data.length ?
            result.data[0] :
            result.data;

        const graphNodes = user.vNestedSetsGraphs.filter(g => {
            return g.vNode;
        });

        const nodes = [];
        const edges = [];
        for (let i = 0; i < graphNodes.length; i++) {
            const graphNode = graphNodes[i];
            graphNode.outgoingVEdges = graphNode.outgoingVEdges || [];
            graphNode.incomingVEdges = graphNode.incomingVEdges || [];
            const node = new Node(graphNode);
            sanitizeLoadedNode(node);
            node.childrenLoaded$.next(true);
            nodes.push(node);

            for (let j = 0; j < graphNodes.outgoingVedges.length; j++) {
                const graphOutoingVedge = graphNodes.outgoingVedges[j];
                const edge = new Edge(graphOutoingVedge);
                sanitizeLoadedEdge(edge);
                edges.push(edge);
            }
            for (let j = 0; j < graphNodes.incomingVEdges.length; j++) {
                const graphOutoingVEdge = graphNodes.incomingVEdges[j];
                const edge = new Edge(graphOutoingVEdge);
                sanitizeLoadedEdge(edge);
                edges.push(edge);
            }
        }


        this.net.addNodesAndEdges(nodes, edges);
    }

    loadSourceNodesIntoNet(result) {
        if (!result || !result.data) {
            this.net.nodes$.next([]);
            return;
        }
        const user = result.data.length ?
            result.data[0] :
            result.data;

        const graphNodes = user.vNestedSetsGraphs.map(g => {
            return g.vNode;
        });


        const nodes = [];
        for (let i = 0; i < graphNodes.length; i++) {
            const graphNode = graphNodes[i];

            const n = new Node(graphNode);
            n.childCount = (graphNode.rgt - graphNode.lft) / 2;
            sanitizeLoadedNode(n);
            n.setNet(this.net);
            n.expanded$.next(false);
            n.childrenLoaded$.next(false);
            nodes.push(n);
        }

        /**
         * @type {Edge[]}
         */
        // There should be a way to clear the net
        // TODO maybe merge the source nodes so we don't over-write already nodes
        this.net.addNodesAndEdges(nodes, []);
        /*        this.net.nodes$.next(nodes);*/
    }

    loadNodesAndEdgeResultIntoNet(result) {
        if (!result || !result.data) {
            this.net.pushMessage("Bad results, net will be set to empty");
            this.net.clear();
            return;
        }
        const user = result.data.length ?
            result.data[0] :
            result.data;

        /**
         * @type {Node[]}
         */
        const nodes = user.vNodes.map(o => {
            const n = new Node(o);
            // When loaded as a net all results are loaded for now,
            // and expanded by default
            n.expanded$.next(true);
            n.childrenLoaded$.next(true);
            return n;
        });
        /**
         * @type {Edge[]}
         */
        const edges = user.edges.map(o => new Edge(o));
        // There should be a way to clear the net
        nodes.map(sanitizeLoadedNode);
        edges.map(sanitizeLoadedEdge);
        this.net.addNodesAndEdges(nodes, edges);
    }

    /**
     *
     * @param node {Node}
     * @param url {string}
     * @return {Promise<void>}
     */
    async loadNodeDescendantsIntoNet(node, url) {
        const o = this.loadingObjectList.newLoadingObject("Loading node children id: " + node.id);
        try {
            const nodeFilter = nodesBelowFilter(node.id);
            const nodeResult = await
                axios.get(url, {params: {filter: nodeFilter}});
            let user;
            if (Array.isArray(nodeResult.data)) {
                user = nodeResult.data[0];
            } else {
                user = nodeResult.data
            }
            const vNestedSetsGraph = user.vNestedSetsGraphs;
            // Ok so I have to take the outgoing vEdges of myself, but the rest I don't need
            const baseGraph = vNestedSetsGraph[0];
            const myself = baseGraph.vNestedSetsGraphMates.find(g => g.id === baseGraph.id);
            const myOutgoingEdges = myself.vNode.outgoingVEdges.map(o => new Edge(o));
            const vNestedSetsGraphMates = baseGraph.vNestedSetsGraphMates
                .filter(g => g !== myself);
            // !!! You have to do this first because the node
            // constructor will get rid of the outgoingVEdges property
            let nodes = vNestedSetsGraphMates.map(g => g.vNode);
            let edges = flatten(nodes.map(n => n.outgoingVEdges).concat(nodes.map(n => n.incomingVEdges))).map(o => new Edge(o));
            edges = edges.concat(myOutgoingEdges);
            nodes = nodes.map(o => new Node(o));
            nodes.map(n => {
                sanitizeLoadedNode(n);
                n.expanded$.next(true);
                n.childrenLoaded$.next(true);
            });
            edges.map(sanitizeLoadedEdge);
            nodes.map(n => n.expanded$.next(true));
            this.net.addNodesAndEdges(nodes, edges);
            o.resolve("" + nodes.length + " children loaded");
        }
        catch (e) {
            o.reject(e);
        }
    }

    /**
     *
     * @param {String} accessToken
     * @param {Number} userId
     * @param {String} email
     */
    setLoginResults(accessToken, userId, email) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.email = email;
        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem(USER_ID, this.userId);
        axios.defaults.params['access_token'] = localStorage.getItem('access_token');
    }
}

























