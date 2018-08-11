import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import {debounce} from 'lodash'

import VueRx from 'vue-rx'

import {Net, NetPersistor, UserExperience} from './net';

Vue.use(VueRx);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

const persistor = new NetPersistor(
    (node) => Net.newNode(node).then(() => node.persisted = true),
    (edge) => Net.newEdge(edge).then(() => edge.persisted = true),
    (nodeRevision) => Net.persistNodeRevision(nodeRevision).then(() => nodeRevision.persisted = true),
    (edgeRevision) => Net.persistEdgeRevision(edgeRevision).then(() => edgeRevision.persisted = true),
    ""
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
}).$mount('#app')
