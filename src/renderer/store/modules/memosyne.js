import axios from 'axios';
import {Node, Edge, Net, NetPersistor} from '../../net';

const DebugStore = require('debug')('mem:store');

const UrlUsers = 'api/Users';
const UrlDefaultUser = 'api/DefaultUsers';
const UrlNodes = 'api/Nodes';
const UrlEdges = 'api/Edges';
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
            relation: 'nodes',
            scope: {
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

axios.defaults.headers.common['access_token'] = localStorage.getItem('access_token');

const state = {
    email: '',
    userId: '',
    accessToken: '',
    net: undefined,
    netPersistor: undefined,
    selectedNodes: [],
    rootNodeFilter: (n) => n.classification === 'book',
    depthMarkNode: undefined
};

const mutations = {
    setNetFromResult(state, {result}) {
        if (!result || !result.data || !result.data.length) {
            state.net = new Net([], []);
            return;
        }
        const user = result.data[0];

        const nodes = user.nodes.map(o => new Node(o));
        const edges = user.edges.map(o => new Edge(o));
        state.net = new Net(nodes, edges, state.netPersistor);
    },
    /**
     *
     * @param state
     * @param node {Node}
     * @param event {Event}
     */
    nodeSelected(state, {node, event}) {
        state.selectedNodes = [node];
    },
    setNetPersistor(state, {netPersistor}) {
        state.netPersistor = netPersistor;
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
        const result = await axios.get(resolveApiUrl(UrlDefaultUser), {params: {filter: netFilter}});
        commit('setNetFromResult', {result});
    },
    async getUserNet({commit}) {
        const result = await axios.get(resolveApiUrl(UrlUsers, localStorage.getItem(USER_ID)), {params: {filter: netFilter}});
        commit('setNetFromResult', {result});
    },
    async checkLoginGetNodes({state, dispatch, commit}) {
        const loggedIn = await dispatch('isAuthenticated');
        if (loggedIn) {
            await dispatch('getUserNet');
        } else {
            await dispatch('getDefaultNet');
        }
    },
    async login({state}, {email, password}) {
        await axios.post(resolveApiUrl(UrlUsers, 'login'), {email, password})
    },
    async logout({}) {
        await axios.post(resolveApiUrl(UrlUsers, 'logout'));
    },
    async newNode({state}, {node}) {
        return await axios.post(resolveApiUrl(UrlUsers, state.userId + '', 'Nodes'), node);
    },
    async newEdge({state}, {edge}) {
        return await axios.post(resolveApiUrl(UrlUsers, state.userId + '', 'Edges'), edge);
    },
    async persistNodeRevision({state}, {nodeRevision}) {
        return nodeRevision.id ?
            await axios.put(resolveApiUrl(UrlUsers, state.userId+ '', 'NodeRevisions', nodeRevision.id + ''), nodeRevision) :
            await axios.post(resolveApiUrl(UrlUsers, state.userId+ '', 'NodeRevisions'), nodeRevision)
    },
    async persistEdgeRevision({state}, {edgeRevision}) {
        return edgeRevision.id ?
            await axios.put(resolveApiUrl(UrlUsers, state.userId+ '', 'NodeRevisions', edgeRevision.id + ''), edgeRevision) :
            await axios.post(resolveApiUrl(UrlUsers, state.userId+ '', 'NodeRevisions'), edgeRevision)
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

        return net ?
            net.nodes.filter(state.rootNodeFilter) :
            [];

    },
    selectedNodes(state) {
        return state.selectedNodes;
    }
};

export default {
    state,
    mutations,
    actions,
    getters
}
