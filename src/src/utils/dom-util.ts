export default class $d {

    /**
     * Bind an HTML Event
     * @param el HTMLElement or id of an HTMLEvent
     * @param event 
     * @param func 
     * @param [passive] 
     * @returns  
     */
    public static event(el, event, func, passive?: any) {
        if (el == null) {
            return;
        }

        passive = passive === undefined ? { passive: false } : passive;

        if (typeof el !== 'object') {
            if (document.getElementById(el) !== null) {
                el = $d.om(el);
            } else {
                console.warn("Not creating eventlistener for '" + event + "' on id '" + el + "'");
                return;
            }
        }

        if (el.attachEvent) {
            return el.attachEvent('on' + event, func);
        } else {
            return el.addEventListener(event, func, passive);
        }
    }

    /**
     * Get HTML element by id. If no element exists a div is created.
     * @param id HTMLElement id
     * @returns HTMLElement
     */
     public static om(id: string): any {
        try {
            return document.getElementById(id) as any;
        } catch (error) {
            console.warn(`Element could not be found ${id}`);
            return document.createElement('div');
        }
    }

    /**
     * Updates every HTML Element with the `data-text` tag
     * @param key the data-text key id
     * @param content the textContent to fill the element with
     * @returns boolean on success
     */
    public static text(key: string, content: string = '') {
        try {
            const attribs = document.querySelectorAll('[data-text]');
            attribs.forEach(function (item: HTMLElement) {
                if (item.dataset.text === key && item.textContent != content) {
                    window.requestAnimationFrame(function () {
                        item.textContent = content;
                    });
                }
            });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * Updates every HTML Element with the `data-text` tag
     * @param key the data-text key id
     * @param content the innerHTML to fill the element with
     * @returns boolean on success
     */
    public static html(key: string, content: string = '') {
        try {
            const attribs = document.querySelectorAll('[data-text]');
            attribs.forEach(function (item: HTMLElement) {
                if (item.dataset.text === key && item.innerHTML != content) {
                    window.requestAnimationFrame(function () {
                        item.innerHTML = content;
                    });
                }
            });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * Updates every HTML Input Elements with the `data-text` tag
     * @param key the data-text key id
     * @param content the value to fill the element with
     * @returns boolean on success
     */
    public static value(key: string, content: string = '') {
        try {
            const attribs = document.querySelectorAll('[data-text]');
            attribs.forEach(function (item: HTMLInputElement) {
                if (item.dataset.key === key) {
                    window.requestAnimationFrame(function () {
                        item.value = content;
                    });
                }
            });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}
