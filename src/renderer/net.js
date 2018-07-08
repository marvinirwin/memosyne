import {Observable, BehaviorSubject, Subject, ReplaySubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators'

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

export class Node extends gen_Node {
    constructor(o) {
        super(o);
        this.parents = [];
        this.children = [];

        let latestR = undefined;
        if (o.nodeRevisions && o.nodeRevisions.length) {
            latestR = o.nodeRevisions[o.nodeRevisions.length - 1];
        }

        this.currentText$ = new BehaviorSubject(latestR.text || '');
        this.currentClassification$ = new BehaviorSubject(latestR.classification || '');
        this.nodeRevisions$ = new BehaviorSubject([]);
        this.latestRevision$ = new BehaviorSubject(undefined);
        this.revisionPublisher$ = new BehaviorSubject(undefined);

        this.nodeRevisions$.subscribe(r => {
            if (!r || !r.length) return;
            this.latestRevision$.next(r[r.length - 1])
        });

        this.currentText$.pipe(debounceTime(1000)).subscribe(() => this.checkAndMaybeCreateRevision());
        this.currentClassification$.pipe(debounceTime(1000)).subscribe(() => this.checkAndMaybeCreateRevision());

        // Fill our noderevisions with nodeRevisions which we know have already been persisted
        this.nodeRevisions$.next(o.nodeRevisions.map(o => new NodeRevision(o, true)));
    }

    checkAndMaybeCreateRevision() {
        const latestRevision = this.latestRevision$.getValue();
        if (!latestRevision) {
            return;
        }
        const currentClassification = this.currentClassification$.getValue() || '';
        const currentText = this.currentText$.getValue() || '';
        if (currentClassification !== latestRevision.classification ||
            currentText !== latestRevision.text) {
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

    // Helper functions for getting and setting & classification
    get text() {
        return this.currentText$.getValue();
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
        this.edgeRevisions = o.edgeRevisions.map(o => new gen_EdgeRevision(o));
        this.nodeStart = undefined;
        this.nodeEnd = undefined;

        this.revisionPublisher$ = new BehaviorSubject(undefined);
    }

    get n1() {
        return this.edgeRevisions.length ?
            this.edgeRevisions[0].n1 :
            NaN
    }

    get n2() {
        return this.edgeRevisions.length ?
            this.edgeRevisions[0].n2 :
            NaN
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
        this.nodes = [];
        this.edges = [];
        this.db = db;
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            this.addNode(this.nodes, this.edges, node);
        }
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            this.addEdge(this.nodes, this.edges, edge);
        }
    }

    /**
     *
     * @param {Node[]} oldNodes
     * @param {Edge[]} oldEdges
     * @param {Node} newNode
     */
    addNode(oldNodes, oldEdges, newNode) {
        const filteredEdges = oldEdges.filter(e => !(e.nodeEnd && e.nodeStart));
        for (let i = 0; i < filteredEdges.length; i++) {
            const filteredEdge = filteredEdges[i];
            if (filteredEdge.n1 === newNode.id) {
                filteredEdge.nodeStart = newNode;
                if (filteredEdge.nodeEnd) {
                    newNode.children.push(filteredEdge.nodeEnd);
                    filteredEdge.nodeEnd.parents.push(newNode);
                }
            }
            if (filteredEdge.n2 === newNode.id) {
                filteredEdge.nodeEnd = newNode;
                if (filteredEdge.nodeStart) {
                    newNode.parents.push(filteredEdge.nodeStart);
                    filteredEdge.nodeEnd.children.push(newNode);
                }
            }
        }
        oldNodes.push(newNode);

        newNode.revisionPublisher$.subscribe(v => {
            if (v) {
                this.db.queNode.push(v);
            }
        })
    }

    /**
     *
     * @param {Node[]} oldNodes
     * @param {Edge[]} oldEdges
     * @param {Edge} newEdge
     */
    addEdge(oldNodes, oldEdges, newEdge) {
        for (let i = 0; i < oldNodes.length; i++) {
            const oldNode = oldNodes[i];
            if (oldNode.id === newEdge.n1) {
                newEdge.nodeStart = oldNode;
                if (newEdge.nodeEnd) {
                    newEdge.nodeEnd.parents.push(newEdge.nodeStart);
                    newEdge.nodeStart.children.push(newEdge.nodeEnd);
                }
            }

            if (oldNode.id === newEdge.n2) {
                newEdge.nodeEnd = oldNode;
                if (newEdge.nodeStart) {
                    newEdge.nodeStart.children.push(newEdge.nodeEnd);
                    newEdge.nodeEnd.parents.push(newEdge.nodeStart);
                }
            }
        }
        oldEdges.push(newEdge);

        newEdge.revisionPublisher$.subscribe(v => {
            if (v) {
                this.db.queEdge.push(v);
            }
        })
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
     *
     * @param {(Node) => void} persistNode
     * @param {(Edge) => void} persistEdge
     * @param {(NodeRevision) => void} persistNodeRevision
     * @param {(EdgeRevision) => void} persistEdgeRevision
     */
    constructor(persistNode, persistEdge, persistNodeRevision, persistEdgeRevision) {
        this.persistNode = persistNode;
        this.persistEdge = persistEdge;
        this.persistNodeRevision = persistNodeRevision;
        this.persistEdgeRevision = persistEdgeRevision;

        this.queNode = [];
        this.queEdge = [];
        this.queNodeRevision = [];
        this.queEdgeRevision = [];

        setTimeout(() => this.attendQue(), 10000);
    }

    async attendQue() {
        for (let i = 0; i < this.queNode.length; i++) {
            const queNodeElement = this.queNode[i];
            await this.persistNode(queNodeElement);
        }
        for (let i = 0; i < this.queEdge.length; i++) {
            const queEdgeElement = this.queEdge[i];
            await this.persistEdge(queEdgeElement);
        }
        for (let i = 0; i < this.queNodeRevision.length; i++) {
            const queNodeRevisionElement = this.queNodeRevision[i];
            await this.persistNodeRevision(queNodeRevisionElement);
        }
        for (let i = 0; i < this.queEdgeRevision.length; i++) {
            const queEdgeRevisionElement = this.queEdgeRevision[i];
            await this.persistEdgeRevision(queEdgeRevisionElement);
        }
    }
}