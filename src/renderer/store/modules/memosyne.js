import axios from 'axios';
import {Node, Edge, Net, NetPersistor, gen_NodeRevision, gen_EdgeRevision, NodeRevision} from '../../net';
import {BehaviorSubject} from 'rxjs';
import * as $ from 'jquery';

const DebugStore = require('debug')('mem:store');



/**
 * Joins params by / and adds API_HOST to the front
 * @param {...String} args
 * @returns String
 */

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
};

const actions = {
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
