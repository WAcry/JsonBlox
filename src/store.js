import {initializeApp} from 'firebase/app';
import {getFirestore, collection, doc, setDoc, getDoc} from 'firebase/firestore';

class OrderedJSON {
    constructor(value, type = 'primitive') {
        this.type = type;
        this.value = value;
    }

    static fromJSON(obj) {
        if (obj === null || typeof obj !== 'object') return new OrderedJSON(obj, 'primitive');
        if (Array.isArray(obj)) {
            const value = obj.map(item => OrderedJSON.fromJSON(item));return new OrderedJSON(value, 'array');
        }/* For objects, preserve order using array of entries */
        const entries = Object.entries(obj).map(([key, value]) => [key, OrderedJSON.fromJSON(value)]);
        return new OrderedJSON(entries, 'object');
    }

    toJSON() {
        if (this.type === 'primitive') return this.value;
        if (this.type === 'array') return this.value.map(item => item.toJSON());/* For objects, reconstruct from entries array to preserve order */
        const obj = {};
        for (const [key, value] of this.value) obj[key] = value.toJSON();/* Add custom iterator to preserve order */
        Object.defineProperty(obj, Symbol.iterator, {
            enumerable: false, value: function* () {
                for (const [key] of this.value) yield [key, this[key]];
            }.bind({value: this.value, ...obj})
        });
        return obj;
    }

    toFirestore() {
        if (this.type === 'primitive') return {type: this.type, value: this.value};
        if (this.type === 'array') return {type: this.type, value: this.value.map(v => v.toFirestore())};/* For objects */
        return {type: this.type, value: this.value.map(([key, value]) => ({key, value: value.toFirestore()}))};
    }

    static fromFirestore(data) {
        if (!data || !data.type) return new OrderedJSON(data, 'primitive');
        if (data.type === 'primitive') return new OrderedJSON(data.value, 'primitive');
        if (data.type === 'array') {
            const value = data.value.map(v => OrderedJSON.fromFirestore(v));
            return new OrderedJSON(value, 'array');
        }
        if (data.type === 'object') {
            const entries = data.value.map(({key, value}) => [key, OrderedJSON.fromFirestore(value)]);
            return new OrderedJSON(entries, 'object');
        }
        return new OrderedJSON(null, 'primitive');
    }
}
const projectId = "aaaaaaa";
const collectionId = "bbbbbbb";

// Firebase is used for example. Serverless functions are recommended for production.
// Use EdgeDB instead in Vercel for better performance and security.
const app = initializeApp({projectId: projectId});
const db = getFirestore(app);
export const storeJsonData = async (freezeJson, nonFreezeJson) => {
    const db = getFirestore();/* if freezeJson is the same as nonFreezeJson, then we can set freezeJson to null */
    if (JSON.stringify(freezeJson) === JSON.stringify(nonFreezeJson)) freezeJson = null;/* Convert to OrderedJSON and then to Firestore format */
    const orderedFreezeJson = OrderedJSON.fromJSON(freezeJson);
    const orderedNonFreezeJson = OrderedJSON.fromJSON(nonFreezeJson);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(orderedFreezeJson) + JSON.stringify(orderedNonFreezeJson));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const id = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const firestoreData = {
        jsonData: orderedFreezeJson.toFirestore(),
        nonFreezeJsonData: orderedNonFreezeJson.toFirestore(),
        createdAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() /* 90 days from now */
    };
    try {
        await setDoc(doc(db, collectionId, id), firestoreData);
        return id;
    } catch (error) {
        console.error('Error storing JSON data:', error);
        throw error;
    }
};
/* Retrieve both freeze and non-freeze JSON data */
export const getJsonData = async (id) => {
    if (!id) return null;
    const db = getFirestore();
    try {
        const docRef = doc(db, collectionId, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error('No document found with id:', id);
            return null;
        }
        const data = docSnap.data();/* Check if document has expired */
        const expireAt = new Date(data.expireAt);
        if (expireAt < new Date()) return null;/* Convert from Firestore format to OrderedJSON and then to regular JSON */
        let freezeJson = OrderedJSON.fromFirestore(data.jsonData).toJSON();
        const nonFreezeJson = OrderedJSON.fromFirestore(data.nonFreezeJsonData).toJSON();
        if (freezeJson === null) freezeJson = nonFreezeJson;
        return {freezeJson, nonFreezeJson, timestamp: data.createdAt};
    } catch (error) {
        console.error('Error retrieving JSON data:', error);
        throw error;
    }
};
