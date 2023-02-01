export default {
    mergeArray(target, source) {
        if (source.length < 5e4) target.push.apply(target, source); else for (let i = 0, len = source.length; i < len; i += 1) target.push(source[i]);
    },
    now: Date.now || function() {
        return new Date().getTime();
    },
    bind(fn, thisArg) {
        return fn.bind ? fn.bind(thisArg) : function() {
            return fn.apply(thisArg, arguments);
        };
    },
    domReady(callback) {
        /complete|loaded|interactive/.test(document.readyState) ? callback() : document.addEventListener("DOMContentLoaded", function() {
            callback();
        }, !1);
    },
    forEach(array, callback, thisArg) {
        if (array.forEach) return array.forEach(callback, thisArg);
        for (let i = 0, len = array.length; i < len; i++) callback.call(thisArg, array[i], i);
    },
    keys(obj) {
        if (Object.keys) return Object.keys(obj);
        const keys = [];
        for (const k in obj) {
            keys.push(k);
        }
        return keys;
    },
    map(array, callback, thisArg) {
        if (array.map) return array.map(callback, thisArg);
        const newArr = []
        for (let i = 0, len = array.length; i < len; i++) newArr[i] = callback.call(thisArg, array[i], i);
        return newArr;
    },
    merge(array1, array2) {
        if (array2.length < 5e4) Array.prototype.push.apply(array1, array2); else for (let ii = 0, iilen = array2.length; ii < iilen; ii += 1) array1.push(array2[ii]);
    },
    arrayIndexOf(array, searchElement, fromIndex) {
        if (array.indexOf) return array.indexOf(searchElement, fromIndex);
        let k, o = array, len = o.length >>> 0;
        if (0 === len) return -1;
        const n = 0 | fromIndex;
        if (n >= len) return -1;
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        for (;k < len; ) {
            if (k in o && o[k] === searchElement) return k;
            k++;
        }
        return -1;
    },
    extend(dst) {
        dst || (dst = {});
        return this.extendObjs(dst, Array.prototype.slice.call(arguments, 1));
    },
    nestExtendObjs(dst, objs) {
        dst || (dst = {});
        for (let i = 0, len = objs.length; i < len; i++) {
            const source = objs[i];
            if (source) for (const prop in source) source.hasOwnProperty(prop) && (utils.isObject(dst[prop]) && utils.isObject(source[prop]) ? dst[prop] = utils.nestExtendObjs({}, [ dst[prop], source[prop] ]) : dst[prop] = source[prop]);
        }
        return dst;
    },
    extendObjs(dst, objs) {
        dst || (dst = {});
        for (let i = 0, len = objs.length; i < len; i++) {
            const source = objs[i];
            if (source) for (const prop in source) source.hasOwnProperty(prop) && (dst[prop] = source[prop]);
        }
        return dst;
    },
    subset(props) {
        const sobj = {};
        if (!props || !props.length) return sobj;
        this.isArray(props) || (props = [ props ]);
        this.forEach(Array.prototype.slice.call(arguments, 1), function(source) {
            if (source) for (let i = 0, len = props.length; i < len; i++) source.hasOwnProperty(props[i]) && (sobj[props[i]] = source[props[i]]);
        });
        return sobj;
    },
    isArray(obj) {
        return Array.isArray ? Array.isArray(obj) : "[object Array]" === Object.prototype.toString.call(obj);
    },
    isObject(obj) {
        return "[object Object]" === Object.prototype.toString.call(obj);
    },
    isFunction(obj) {
        return "[object Function]" === Object.prototype.toString.call(obj);
    },
    isNumber(obj) {
        return "[object Number]" === Object.prototype.toString.call(obj);
    },
    isString(obj) {
        return "[object String]" === Object.prototype.toString.call(obj);
    },
    isHTMLElement(n) {
        return window["HTMLElement"] || window["Element"] ? n instanceof (window["HTMLElement"] || window["Element"]) : n && "object" == typeof n && 1 === n.nodeType && "string" == typeof n.nodeName;
    },
    isSVGElement(n) {
        return window["SVGElement"] && n instanceof window["SVGElement"];
    },
    isDefined(v) {
        return "undefined" != typeof v;
    },
    random(length) {
        let str = "", chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz", clen = chars.length;
        length || (length = 6);
        for (let i = 0; i < length; i++) str += chars.charAt(this.randomInt(0, clen - 1));
        return str;
    },
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    inherit(child, parent) {
        function Ctor() {
            this.constructor = child;
        }
        for (const key in parent) parent.hasOwnProperty(key) && (child[key] = parent[key]);
        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
    },
    trim(s) {
        return s ? s.trim ? s.trim() : s.replace(/^\s+|\s+$/gm, "") : "";
    },
    trigger(el, evt, detail) {
        if (el) {
            detail = detail || {};
            let e, opt = {
                bubbles: !0,
                cancelable: !0,
                detail
            };
            if ("undefined" != typeof CustomEvent) {
                e = new CustomEvent(evt, opt);
                el.dispatchEvent(e);
            } else try {
                e = document.createEvent("CustomEvent");
                e.initCustomEvent(evt, !0, !0, detail);
                el.dispatchEvent(e);
            } catch (exp) {
                this.log.error(exp);
            }
            return !0;
        }
        this.log.error("emply element passed in");
    },
    nextTick(f) {
        ("object" == typeof process && process.nextTick ? process.nextTick : function(task) {
            setTimeout(task, 0);
        })(f);
    },
    removeFromArray(arr, val) {
        const index = arr.indexOf(val);
        index > -1 && arr.splice(index, 1);
        return index;
    },
    debounce(func, wait, immediate) {
        var timeout, args, context, timestamp, result, later = function() {
            const last = this.now() - timestamp;
            if (last < wait && last >= 0) timeout = setTimeout(later, wait - last); else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    timeout || (context = args = null);
                }
            }
        };
        return function() {
            context = this;
            args = arguments;
            timestamp = this.now();
            const callNow = immediate && !timeout;
            timeout || (timeout = setTimeout(later, wait));
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
            return result;
        };
    },
    throttle(func, wait, options) {
        let context, args, result, timeout = null, previous = 0;
        options || (options = {});
        const later = function() {
            previous = options.leading === !1 ? 0 : this.now();
            timeout = null;
            result = func.apply(context, args);
            timeout || (context = args = null);
        };
        return function() {
            const now = this.now();
            previous || options.leading !== !1 || (previous = now);
            const remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                timeout || (context = args = null);
            } else timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining));
            return result;
        };
    },
    ucfirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    escapeHtml(text) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        };
        return (`${text  }`).replace(/[&<>"']/g, function(m) {
            return map[m];
        });
    }
}
