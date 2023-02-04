const utils = {
  mergeArray(target, source) {
    if (source.length < 5e4) target.push.apply(target, source)
    else for (let i = 0, len = source.length; i < len; i += 1) target.push(source[i])
  },
  now:
    Date.now ||
    function () {
      return new Date().getTime()
    },
  bind(fn, thisArg) {
    return fn.bind
      ? fn.bind(thisArg)
      : function () {
          return fn.apply(thisArg, arguments)
        }
  },
  forEach(array, callback, thisArg) {
    if (array.forEach) return array.forEach(callback, thisArg)
    for (let i = 0, len = array.length; i < len; i++) callback.call(thisArg, array[i], i)
  },
  map(array, callback, thisArg) {
    if (array.map) return array.map(callback, thisArg)
    const newArr = []
    for (let i = 0, len = array.length; i < len; i++) newArr[i] = callback.call(thisArg, array[i], i)
    return newArr
  },
  merge(array1, array2) {
    if (array2.length < 5e4) Array.prototype.push.apply(array1, array2)
    else for (let ii = 0, iilen = array2.length; ii < iilen; ii += 1) array1.push(array2[ii])
  },
  arrayIndexOf(array, searchElement, fromIndex) {
    if (array.indexOf) return array.indexOf(searchElement, fromIndex)
    let k,
      o = array,
      len = o.length >>> 0
    if (0 === len) return -1
    const n = 0 | fromIndex
    if (n >= len) return -1
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)
    for (; k < len; ) {
      if (k in o && o[k] === searchElement) return k
      k++
    }
    return -1
  },
  extend(dst) {
    dst || (dst = {})
    return this.extendObjs(dst, Array.prototype.slice.call(arguments, 1))
  },
  extendObjs(dst, objs) {
    dst || (dst = {})
    for (let i = 0, len = objs.length; i < len; i++) {
      const source = objs[i]
      if (source) for (const prop in source) source.hasOwnProperty(prop) && (dst[prop] = source[prop])
    }
    return dst
  },
  debounce(func, wait, immediate) {
    let timeout,
      args,
      context,
      timestamp,
      result,
      later = function () {
        const last = utils.now() - timestamp
        if (last < wait && last >= 0) timeout = setTimeout(later, wait - last)
        else {
          timeout = null
          if (!immediate) {
            result = func.apply(context, args)
            timeout || (context = args = null)
          }
        }
      }
    return function () {
      context = this
      args = arguments
      timestamp = utils.now()
      const callNow = immediate && !timeout
      timeout || (timeout = setTimeout(later, wait))
      if (callNow) {
        result = func.apply(context, args)
        context = args = null
      }
      return result
    }
  },
  throttle(func, wait, options) {
    let context,
      args,
      result,
      timeout = null,
      previous = 0
    options || (options = {})
    const later = function () {
      previous = options.leading === !1 ? 0 : utils.now()
      timeout = null
      result = func.apply(context, args)
      timeout || (context = args = null)
    }
    return function () {
      const now = utils.now()
      previous || options.leading !== !1 || (previous = now)
      const remaining = wait - (now - previous)
      context = this
      args = arguments
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        result = func.apply(context, args)
        timeout || (context = args = null)
      } else timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining))
      return result
    }
  },
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    }
    return `${text}`.replace(/[&<>"']/g, function (m) {
      return map[m]
    })
  }
}
export { utils as default }
