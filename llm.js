class LCGLLM extends HTMLElement {
    constructor() {
        super();
    }

    // Gets the models endpoint from the element's data-models endpoint.
    getModelsEndpoint() {
        return this.dataset.models;
    }
    
    // Gets the completions endpoint from the element's data-completion attribute.
    getCompletionsEndpoint() {
        return this.dataset.completion;
    }

    // Gets the list of models from the IndexedDB.
    async getModelsFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("chestnut", 1);

            request.onerror = () => {
                reject(request.error);
            };

            // Create the object store if it doesn't exist.
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("models")) {
                    console.log("Creating new models store in IndexedDB.");
                    db.createObjectStore("models", { keyPath: "id" });
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const txn = db.transaction(["models"], "readonly");
                const objectStore = txn.objectStore('models');
                const models = [];
                objectStore.openCursor().onsuccess = (event) => {
                    console.log("Retrieving models from IndexedDB.");
                    const cursor = event.target.result;
                    if (cursor) {
                        models.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(models);
                    }
                }
            }
        });
    }

    // Stores the list of models in the models IndexedDB.
    async storeModelsInIndexedDB(models) {
        const request = indexedDB.open("chestnut", 1);
        return new Promise((resolve, reject) => {
            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log("Storing models in the models IndexedDB.");
                const db = request.result;
                const txn = db.transaction(["models"], "readwrite");
                const objectStore = txn.objectStore("models");

                models.forEach((model) => {
                    objectStore.add(model);
                });

                txn.oncomplete = () => {
                    resolve(models);
                }
            }
        });
    }

    // Gets the models from the API endpoint specified on the element's data-models attribute.
    async getModelsFromAPI() {
        console.log("Getting models from the API.");
        
        const modelsEndpoint = this.getModelsEndpoint();
        if (!modelsEndpoint) {
            throw new Error("No models endpoint passed on data-models attribute.");
        }

        const response = await fetch(
            modelsEndpoint,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        return await response.json();
    }

    // Tries to fetch the models list from the database, failing that, fetches from the API.
    async getModels() {
        let models = await this.getModelsFromIndexedDB();
        if (models.length == 0) {
            models = await this.getModelsFromAPI();
            if (models.length != 0) {
                models = models.data;
                await this.storeModelsInIndexedDB(models);
            }
        }

        return models;
    }

    async getConversationFromIndexedDB(uuid) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("chestnut", 1);
            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                const db = request.result;
                const txn = db.transaction(["conversations"], "readonly");
                const objectStore = txn.objectStore("conversations");
                const getRequest = objectStore.get(uuid);
                getRequest.onerror = () => {
                    reject(request.error);
                };
                getRequest.onsuccess = () => {
                    resolve(getRequest.result);
                };
            };
        });
    }

    // Gets all conversations from the IndexedDB.
    async getConversationsListFromIndexedDB() {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open("chestnut", 1);

            request.onerror = () => {
                reject(request.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("conversations")) {
                    console.log("Creating new conversations store in IndexedDB.");
                    db.createObjectStore("conversations", { keyPath: "uuid" });
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const txn = db.transaction(["conversations"], "readonly");
                const objectStore = txn.objectStore("conversations");
                const conversations = [];

                objectStore.openCursor().onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const conversation = cursor.value;
                        conversations.push({ uuid: cursor.uuid, model: cursor.model, title: cursor.title });
                        cursor.continue();
                    } else {
                        resolve(conversations);
                    }
                };
            }
        });
    }

    // Stores a conversation in the conversations IndexedDB.
    async storeConversation(conversation) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("chestnut", 1);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                const db = request.result;
                const txn = db.transaction(["conversations"], "readwrite");
                const objectStore = txn.objectStore("conversations");

                if (!Object.keys(conversation).includes("uuid")) {
                    conversation.uuid = this.generateUUID();
                }

                objectStore.put(conversation);

                txn.oncomplete = () => {
                    resolve(conversation);
                };
            };
        });
    }

    // Generates a version 4 UUID with cryptographic randoms.
    generateUUID() {
        if (!window.crypto || !window.crypto.getRandomValues) {
            throw new Error('Unsupported browser.');
        }
        const buffer = new Uint8Array(16);
        window.crypto.getRandomValues(buffer);

        buffer[6] = (buffer[6] & 0x0f) | 0x40;
        buffer[8] = (buffer[8] & 0x3f) | 0x80;

        return ([
            buffer[0].toString(16),
            buffer[1].toString(16),
            buffer[2].toString(16),
            buffer[3].toString(16),
            "-",
            buffer[4].toString(16),
            buffer[5].toString(16),
            "-",
            buffer[6].toString(16),
            buffer[7].toString(16),
            "-",
            buffer[8].toString(16),
            buffer[9].toString(16),
            "-",
            buffer[10].toString(16),
            buffer[11].toString(16),
            buffer[12].toString(16),
            buffer[13].toString(16),
            buffer[14].toString(16),
            buffer[15].toString(16)
        ]).join('');
    }

    openModal(event) {
        const modal = this.querySelector(`div.new-conversation-modal[data-id=${event.target.dataset.target}]`);
        modal.classList.toggle("hidden", false);
    }

    closeModals() {
        const modals = this.querySelectorAll("div.modal:not(.hidden)");
        for (let modal of modals) {
            model.classList.toggle("hidden", true);
        }
    }

    connectedCallback() {
        // Setup our shadow DOM.
        const shadow = this.attachShadow({mode: "open"});

        // Load in relevant styles.
        const styles = document.createElement("link");
        styles.rel="stylesheet";
        styles.href="llm.css";
        shadow.appendChild(styles);

        // Base UI.
        const container = document.createElement("div");
        const sideBar = document.createElement("div");
        const chatWindow = document.createElement("div");
        container.appendChild(sideBar);
        container.appendChild(chatWindow);

        // New Conversations Button
        const newButton = document.createElement("button");
        newButton.innerText = "New Button";
        newButton.dataset.target = "new-conversation-modal";
        newButton.addEventListener("click", this.openModal);
        sideBar.appendChild(newButton);

        // New Conversation Modal.
        const newConversationModal = document.createElement("div");
        newConversationModal.dataset.dataId = "new-conversation-modal";
        newConversationModal.classList.add("modal");
        newConversationModal.classList.add("hidden");

        // The close button for the modal.
        const closeNewConversationModalButton = document.createElement("button");
        closeNewConversationModalButton.innerText = "X";
        closeNewConversationModalButton.addEventListener("click", this.closeModals());
        newConversationModal.appendChild(closeNewConversationModalButton);

        // Setup the model options on new conversation modal.
        const modelSelect = document.createElement("select");
        const modelNone = document.createElement("option");
        modelNone.innerText = "Select a model";
        modelSelect.appendChild(modelNone);
        this.getModels().then(results => {
            for (const model of results) {
                const modelOption = document.createElement("option");
                const keys = Object.keys(model);
                for (const key of keys) {
                    modelOption.dataset[key] = model[key];
                }
                modelOption.innerText = model.id;
                modelOption.value = model.id;
                modelSelect.appendChild(modelOption);
            }
        });
        newConversationModal.appendChild(modelSelect);
        shadow.appendChild(newConversationModal);
        shadow.appendChild(container);
    }
}
customElements.define("lcg-llm", LCGLLM);
