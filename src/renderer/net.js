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
        this.nodeRevisions = o.nodeRevisions.map(o => new gen_NodeRevision(o));
        this.parents = [];
        this.children = [];
    }
    get classification() {
        return this.nodeRevisions.length ?
            this.nodeRevisions[0].classification :
            ''
    }

    get latestText() {
        return this.nodeRevisions.length ?
            this.nodeRevisions[0].text :
            ''
    }

    /**
     * Returns all nodes except this one
     * @param {Node} child
     * @return {*[]}
     */
    siblings(child) {
        return this.children.filter(n => n !== child);
    }
}

export class Edge extends gen_Edge {
    constructor(o) {
        super(o);
        this.edgeRevisions = o.edgeRevisions.map(o => new gen_EdgeRevision(o));
        this.nodeStart = undefined;
        this.nodeEnd = undefined;
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
     */
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = [];
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


























