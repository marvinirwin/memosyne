import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import {debounce} from 'lodash'

import VueRx from 'vue-rx'


import {Net, RequestHandler, UserExperience} from './net';

import {
    Vuetify, // required
    VApp, // required
    VSnackbar,
} from 'vuetify/es5/components';

Vue.use(
    Vuetify, {
        components: {
            VApp,
            VSnackbar,
        }
    });

Vue.use(VueRx);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

const persistor = new RequestHandler(
    (node) => Net.newNode(node).then(() => node.persisted = true),
    (edge) => Net.newEdge(edge).then(() => edge.persisted = true),
    (nodeRevision) => Net.persistNodeRevision(nodeRevision).then(() => nodeRevision.persisted = true),
    (edgeRevision) => Net.persistEdgeRevision(edgeRevision).then(() => edgeRevision.persisted = true),
    "",
    /**
     *
     * @param e {XMLHttpRequest}
     */
    (e) => {
        // HACK I'm counting on the userExperience variable to hoisted, so the declaration order doesn't matter
        userExperience.pushMessage("Error " + e.status);
    }
);

const net = new Net([], [], persistor);
const userExperience = new UserExperience(net);
userExperience.checkLoginGetNodes().catch(e => console.log(e));

Vue.mixin({
    data() {
        return {
                net,
                userExperience
        }
    }
});


/* eslint-disable no-new */
new Vue({
    components: {App},
    router,
    store,
    template: '<App/>'

