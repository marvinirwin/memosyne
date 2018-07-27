import axios from 'axios';
import {Node, Edge, Net, NetPersistor, gen_NodeRevision, gen_EdgeRevision, NodeRevision} from '../../net';
import {BehaviorSubject} from 'rxjs';
import * as $ from 'jquery';

const DebugStore = require('debug')('mem:store');

const api = 'api';
const UrlUsers = 'Users';
const UrlDefaultUser = 'DefaultUsers';
const UrlNodes = 'Nodes';
const UrlVNodes = 'VNodes';
const UrlEdges = 'Edges';
const UrlNodeRevisions = 'NodeRevisions';
const UrlEdgeRevisions = 'EdgeRevisions';

const USER_ID = 'USER_ID';

/**
 * Joins params by / and adds API_HOST to the front
 * @param {...String} args
 * @returns String
 */
function resolveApiUrl(...args) {
    return [process.env.API_HOST].concat(args).join('/');
}

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

// What is axios.defaults.auth?  How is it different than headers?
// Can I set a default query string parameter?
axios.defaults.params = {};
axios.defaults.params['access_token'] = localStorage.getItem('access_token');

/**
 *
 * @param element {HTMLElement}
 */
function scrollToCenter(element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const absoluteElementLeft = elementRect.left + window.pageXOffset;
    const middleTop = absoluteElementTop - (window.innerHeight / 2);
    const middleLeft = absoluteElementLeft - (window.innerWidth / 2);
    window.scrollTo(middleLeft, middleTop);
    /*    window.scrollTo({
                top: middleTop,
                left: middleLeft,
            behavior: 'smooth'
            }
        )*/
}

/**
 *
 * @param state {Object}
 * @param oldInstance {Vue}
 * @param newInstance {Vue}
 */
function setFocusedInstance(state, oldInstance, newInstance) {
    state.selectedNodes$.next([newInstance.node]);
    newInstance.$refs.textarea.focus();
    newInstance.$refs.textarea.click();
    /**
     * This is the part of the node we focus
     * @type {HTMLElement}
     */
    const el = newInstance.$refs.nucleus;
    $('html,body').animate({ scrollTop: $(el).offset().top - ( $(window).height() - $(el).outerHeight(true) ) / 2  }, 200);

    event.stopPropagation();
    event.preventDefault();
}

const state = {
    email: '',
    userId: '',
    accessToken: '',
    net: undefined,
    netPersistor: undefined,
    /**
     *
     * @param n {Node}
     * @return {boolean|*}
     */
    rootNodeFilter: (n) => {
        return n.predecessorNodes.length === 0;
    },
    depthMarkNode: undefined,
    selectedNodes$: new BehaviorSubject([]),
    nodeElementMap: {},
};

const mutations = {
    /**
     *
     * @param state
     * @param result
     */
    setNetFromResult(state, {result}) {
        if (!result || !result.data || !result.data.length) {
            state.net.nodes = [];
            state.net.edges = [];
            return;
        }
        const user = result.data[0];

        const nodes = user.vNodes.map(o => new Node(o));
        const edges = user.edges.map(o => new Edge(o));
        state.net = new Net(nodes, edges, state.netPersistor);
    },
    /**
     *
     * @param state
     * @param node {Node[]}
     */
    setSelectedNodes(state, {nodes}) {
        state.selectedNodes$.next(nodes);
    },
    /**
     *
     * @param state
     * @param {NetPersistor} netPersistor
     */
    setNetPersistor(state, {netPersistor}) {
        state.netPersistor = netPersistor;
    },
    /**
     *
     * @param state
     * @param {String} accessToken
     * @param {Number} userId
     */
    setLoginResults(state, {accessToken, userId, email}) {
        state.accessToken = accessToken;
        state.userId = userId;
        state.email = email;
        localStorage.setItem('access_token', state.accessToken);
        localStorage.setItem(USER_ID, state.userId);
        axios.defaults.params['access_token'] = localStorage.getItem('access_token');
    }
};

const actions = {
    async isAuthenticated({state}) {
        if (!localStorage.getItem('access_token')) {
            return false;
        }

        try {
            await axios.get(`${UrlUsers}/${state.userId}/Nodes`, {params: {filter: {limit: 0}}});
        } catch (e) {
            DebugStore(e);
            return false;
        }
        return true;
    },
    async getDefaultNet({commit}) {
        const result = await axios.get(resolveApiUrl(api, UrlDefaultUser), {params: {filter: netFilter}});
        commit('setNetFromResult', {result});
    },
    async getUserNet({commit}) {
        const result = await axios.get(resolveApiUrl(api, UrlUsers, localStorage.getItem(USER_ID)), {params: {filter: netFilter}});
        commit('setNetFromResult', {result});
    },
    async checkLoginGetNodes({state, dispatch}) {
        const loggedIn = await dispatch('isAuthenticated');
        if (loggedIn) {
            await dispatch('getUserNet');
        } else {
            await dispatch('getDefaultNet');
        }
    },
    async login({state, commit}, {email, password}) {
        const result = await axios.post(resolveApiUrl(api, UrlUsers, 'login'), {email, password});
        commit('setLoginResults', {email, accessToken: result.data.id, userId: result.data.userId})
    },
    async logout({}) {
        await axios.post(resolveApiUrl(api, UrlUsers, 'logout'));
    },
    /**
     *
     * @param state
     * @param node
     * @return {Promise<Node>}
     */
    async newNode({state}, {node}) {
        const returned = await axios.post(resolveApiUrl(api, UrlNodes), node);
        const result = await axios.get(resolveApiUrl(api, UrlNodes, returned.data.id + ''));
        return new Node(result.data);
    },
    /**
     * @param state
     * @param {Edge} edge
     * @return {Promise<Edge>}
     */
    async newEdge({state}, {edge}) {
        const returned = await axios.post(resolveApiUrl(api, UrlEdges), edge);
        const result = await axios.get(resolveApiUrl(api, UrlEdges, returned.data.id + ''));
        return new Edge(result.data);
    },
    /**
     *
     * @param state
     * @param {NodeRevision} nodeRevision
     * @return {Promise<NodeRevision>}
     */
    async persistNodeRevision({state}, {nodeRevision}) {
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
    },
    /**
     *
     * @param state
     * @param {gen_EdgeRevision} edgeRevision
     * @return {Promise<gen_EdgeRevision>}
     */
    async persistEdgeRevision({state}, {edgeRevision}) {
        const result = edgeRevision.id ?
            await axios.put(resolveApiUrl(api, UrlEdgeRevisions, edgeRevision.id + ''), revisitionResult) :
            await axios.post(resolveApiUrl(api, UrlEdgeRevisions), edgeRevision);
        const revisitionResult = await axios.get(
            resolveApiUrl(api, UrlUsers,
                localStorage.getItem(USER_ID),
                UrlEdges,
                edgeRevision.edgeId + '',
                UrlEdgeRevisions,
                result.data.id + ''));

        const revision = new gen_EdgeRevision(revisitionResult.data);
        return revision;
    },
    /**
     *
     * @param state
     * @param {Vue} vueInstance
     * @param {Node} node
     * @param {KeyboardEvent} event
     */
    async handleHotkeyPress({state, dispatch}, {vueInstance, node, event}) {
        DebugStore('Handling hotkey press ', event.key);
        let siblingRefs = [];
        let newInstance;
        let siblingInstances = [];
        let myIndex = -1;
        switch (event.key) {
            case "Enter":
                const selectedNodes = state.selectedNodes$.getValue();
                // If there aren't any nodes selected create a root node
                DebugStore('Current selected nodes: ', selectedNodes);
                dispatch('handleNewNode', selectedNodes);
                break;
            case "Escape":
                // If you pressed escape then de-select all nodes;
                DebugStore('De-Selecting all nodes');
                state.selectedNodes$.next([]);
                break;
            case "ArrowLeft":
                // In the case of a left arrow we want to go to
                // that vue instance's immediate parent's node
                DebugStore('Selecting parent node');
                let parent = vueInstance.$parent;
                let parentNode = parent.node;
                state.selectedNodes$.next([parentNode]);
                setFocusedInstance(state, vueInstance, parent);
                // parent.focusTextarea();
                break;
            case "ArrowRight":
                DebugStore('Selecting child node');
                let child = vueInstance.$parent;
                let childNode = child.node;

                setFocusedInstance(state, vueInstance, child);
                break;
            case "ArrowUp":
                DebugStore('Selecting sibling above, or wrapping around');
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
                setFocusedInstance(state, vueInstance, newInstance);
                break;
            case "ArrowDown":
                DebugStore('Selecting sibling below, or wrapping around');
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
                setFocusedInstance(state, vueInstance, newInstance);
                break;
        }
    },
    /**
     *
     * @param state
     * @param dispatch
     * @param nodes {Node[]}
     * @return {Promise<void>}
     */
    async handleDeleteNodes({state, dispatch}, {nodes}) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            /**
             * @type {NodeRevision}
             */
            const o = node.latestRevision$.getValue();
            o.visible = false;
            await dispatch('persistNodeRevision', o);
        }
    },
    /**
     *
     * @param state
     * @param dispatch
     * @param parents {Node[]}
     * @return {Promise<void>}
     */
    async handleNewNode({state, dispatch}, {parents}) {
        const o = await dispatch('createNodeAndEdges', {text: '', classification: '', parents});
        state.net.addNodesAndEdges([], [o.node]);
        o.edges.map((e) => state.net.addNodesAndEdges(state.net.nodes, state.net.edges, e));
    },
    /**
     *
     * @param state
     * @param dispatch
     * @param {String} text
     * @param {String} classification
     * @param {Node[]} parents
     * @return {Promise<{node: Node, edges: Edge[]}>}
     */
    async createNodeAndEdges({state, dispatch}, {text, classification, parents}) {
        const newNode = await dispatch('newNode', {});
        const newNodeRevision = await dispatch('persistNodeRevision', {
            nodeRevision: new gen_NodeRevision({
                text,
                classification,
                nodeId: newNode.id
            })
        });

        newNode.nodeRevisions$.next(newNode.nodeRevisions$.getValue().concat(newNodeRevision));
        const newEdges = [];
        if (parents) {
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                const edge = await dispatch('newEdge', {});
                const revision = await dispatch('persistEdgeRevision', {
                    edgeRevision: {
                        edgeId: edge.id,
                        n1: parent.id,
                        n2: newNode.id,
                        classification: 'parent',
                    }
                });
                edge.edgeRevisions$.next(edge.edgeRevisions$.getValue().concat(revision));
                newEdges.push(edge);
            }
        }
        return {node: newNode, edges: newEdges};
    }
};

const getters = {
    /**
     * Returns nodes from which to walk to graph from
     * @param state
     * @return {Node[]}
     */
    displayRootNodes(state) {
        const net = state.net;

        if (state.depthMarkNode) {
            // If we had a depthMarkNode we would walk down the graph a bit before calculating the nodes to draw
        }

        const result = net ?
            net.nodes.filter(state.rootNodeFilter) :
            [];

        return result
    },
};

export default {
    state,
    mutations,
    actions,
    getters
}
