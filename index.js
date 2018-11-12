import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators'
import axios from 'axios';
import {uniqueId} from 'lodash';
import {
    api,
    resolveApiUrl,
    UrlEdgeRevisions,
    UrlEdges,
    UrlNodeRevisions,
    UrlNodes,
    UrlVNodes
} from "./src/renderer/net";

const authenticated$ = new BehaviorSubject(false);
const loadingRequests$ = new BehaviorSubject([]);

// First add one to attach an access token to requests
axios.interceptors.request.use(config => {
    config.__uuid = uniqueId();
    config.params = config.params || {};
    config.params['access_token'] = localStorage.getItem('access_token');
    if (config.requestString) {
        loadingRequests$.next(loadingRequests$.getValue().concat({
            text: config.requestString + ' loading...',
            requestString: config.requestString,
            __uuid: config.__uuid
        }))
    }
});
// Second add one to update isAuthenticated$ is request response is 401
axios.interceptors.response.use(response => {
    if (response.status === 401) {
        authenticated$.next(false);
    }
    const loadingRequests = loadingRequests$.getValue();
    const index = loadingRequests.findIndex(o => o.__uuid === response.config.__uuid);
    if (index !== -1) {
        const myReq = loadingRequests[index];
        myReq.text = myReq.requestString + ' finished.';
        // Once the request is finished remove it in 6 seconds
        setTimeout(() => {
            const currentObjects = loadingRequests$.getValue();
            loadingRequests$.next(currentObjects.splice(currentObjects.indexOf(myReq), 1))
        }, 6000);
        // !!! In this one the array hasn't actually changed, but I want it to redraw text
        loadingRequests$.next(loadingRequests);
    }
});

/**
 * @param el {HTMLElement}
 */
function registerLoadingText(el) {
    loadingRequests$.subscribe(v => {
        el.innerText = v.map(v => v.text).join('\n');
    });
}

/**
 *
 * @param el {HTMLElement}
 */
function registerAuthenticatedText(el) {
    authenticated$.subscribe(v => {
        el.innerText = `Authenticated: ${v}`
    });
}

/**
 *
 * @param textArea {HTMLElement}
 * @param markdownContainer {HTMLElement}
 */
function registerTextNode(textArea, markdownContainer) {
    const textValue$ = new Subject();

    markdownContainer.onfocus = e => {
        textArea.style.display = 'block';
        markdownContainer.style.display = 'none';
    };

    textArea.onkeydown = e => {
        switch (e.code) {
            case "Escape":
                textArea.style.display = 'none';
                markdownContainer.style.display = 'block';
        }
    };

    textArea.onchange = e => {
        textValue$.next(textArea.text);
    };

    textValue$.pipe(debounceTime(5000)).subscribe(v => {
        // TODO is this how I access attributes, or can I just do textArea.classification?
        createNodeRevision(textArea.id, textArea.text, textArea.attributes.classification);
    });
}

/**
 *
 * @param nodeId
 * @param text {string}
 * @param classification {string}
 * @return {Promise<void>}
 */
async function createNodeRevision(nodeId, text, classification) {
    try {
        axios.post(resolveApiUrl(api, UrlNodeRevisions), {nodeId, text, classification}, {requestString: 'New node revision'});
    } catch (e) {
        console.log(e);
        throw e;
    }
}

/**
 * @param parentId
 * @return {Promise<void>}
 */
async function createNode(parentId) {
    try {
        const nodeResult = await axios.post(resolveApiUrl(api, UrlNodes), {}, {requestString: 'New node'});
        // Now create the edge between this one and the parent
        const edgeResult = await axios.post(resolveApiUrl(api, UrlEdges), {}, {requestString: 'New edge'});
        const edgeRevisionResult = await axios.post(
            resolveApiUrl(api, UrlEdgeRevisions, {edgeId: edgeResult.data.id, n1: parentId, n2: nodeResult.data.id}),
            {requestString: 'New edge revision'})
        // I think I should just refresh
    } catch (e) {
        throw e;
    }
}


