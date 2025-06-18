
export class Storage{
    constructor(){

    }

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    get(key) {
        const val = localStorage.getItem(key);
        try {
            return JSON.parse(val);
        } catch {
            return null;
        }
    }
    remove(key) {
        localStorage.removeItem(key);
    }
}