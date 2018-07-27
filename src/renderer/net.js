import {Observable, BehaviorSubject, Subject, ReplaySubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators'

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
        this.predecessorNodes = [];
        this.successorNodes = [];
        this.vueInstances = [];

        let latestR = undefined;
        if (o.nodeRevisions && o.nodeRevisions.length) {
            latestR = o.nodeRevisions[o.nodeRevisions.length - 1];
        }

        this.visible = latestR && latestR.visible;

        this.currentText$ = new BehaviorSubject(latestR && latestR.text || '');
        this.currentClassification$ = new BehaviorSubject(latestR && latestR.classification || '');
        this.nodeRevisions$ = new BehaviorSubject([]);
        this.latestRevision$ = new BehaviorSubject(undefined);
        this.revisionPublisher$ = new BehaviorSubject(undefined);
        this.successorEdges$ = new BehaviorSubject([]);
        this.predecessorEdges$ = new BehaviorSubject([]);
        /**
         * @type {Net}
         */
        this.net = undefined;

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

        this.persisted = persisted;
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
    }

    /**
     * @param n {Net}
     */
    setNet(n) {
        this.net = n;
    }
}

export class Cell {
    /**
     *
     * @param {Node} node
     * @param {Number} unitsAbove
     */
    constructor(node, unitsAbove) {
        this.node = node;
        this.unitsAbove = unitsAbove;
    }
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

        this.recomputeDisplaySignal$ = new Subject();
        this.recomputeRelationSignal$ = new Subject();

        this.addNodesAndEdges(nodes, edges);

        this.viewportManager = new ViewportManager();
    }

    /**
     * @param newNodes {Node[]}
     * @param newEdges {Edge[]}
     */
    addNodesAndEdges(newNodes, newEdges) {
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
     * Takes a function which decides if a node is a root node.
     * @param isRoot
     */
    constructColumns(isRoot) {
        const roots = this.nodes.filter(isRoot);
        const columns = [roots];
    }

    /**
     *
     * @param {Cell[]} previousColumn
     */
    constructColumn(previousColumn) {
        for (let i = 0; i < previousColumn.length; i++) {
            const node = previousColumn[i];
            const leavingEdges = this.edges.filter(e => e.n2 === node.id);

        }
    }
}

export class NetPersistor {
    /**
     * TODO figure out how to do function types in jshint
     * @param {(Node) void} persistNode
     * @param {(Edge) => void} persistEdge
     * @param {(NodeRevision) => void} persistNodeRevision
     * @param {(EdgeRevision) => void} persistEdgeRevision
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

    /**
     *
     * @param {function(node): bool} rootNodeFilter
     * @param {Node[]} nodes
     * @param {Node} centeredNode
     */
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

    /**
     *
     * @param {function(node)} setFunc
     * @param {function(node)}resetFunc
     * @param {Node[]} nodes
     * @param {Node[]}toBeReset
     * @param {Node} nodeStart
     * @param {Number} steps
     */
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

    /**
     * Shows every edge (relation) once, this may lead to duplicate nodes though.
     * I made this because I needed to see and modify all relations
     * @param nodes {Node[]}
     * @param edges {Edge[]}
     */
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

    /**
     *
     * @param nodes {Node[]}
     * @param edges {Edges[]}
     * @param newNode {Node}
     */
    static allRelationAddNode(nodes, edges, newNode) {

    }

    static allRelationAddEdge(nodes, edges, newEdge) {

    }


}