/**
 * autorun function start block, relay on Jquery/Zepto
 */
(function() {
    /**
     * for create Class and Inherit
     */
    function createConstructor(name) {
        function constructor() {
            // add the attribute to the instance
            $.extend(true, this, this.$self.$attribute);
        }

        constructor.$className = name;
        return constructor;
    }
    function createClass(name, members) {
        var cls = createConstructor(name);
        var prototype = cls.prototype = {};
        // we lost the constructor, so we make a short name $self to mark it
        prototype.$self = cls;
        // use $attribute to cache the attribute when define class
        cls.$attribute = {};
        addMembers(cls, members);
        return cls;
    }
    function addMembers(cls, members) {
        members = members || {};
        var mixins = null;
        var inherit = null;
        eachPlainObject(members, function (name, member) {
            if (name == 'static') {
                // add static attribute
                $.extend(true, cls, member);
            } else if (name == 'mixins') {
                // mix the method from other class's prototype
                member = $.isArray(member) ? member : [member];
                var length = member.length;
                if (length > 0) {
                    mixins = [{}];
                    for (var i = 0; i < length; i++) {
                        var mb = member[i];
                        if (mb.$className) {
                            mixins.push(mb.prototype);
                        }
                    }
                }
            } else if (name == 'extend') {
                // inherit from the given class
                if (member.$className) {
                    inherit = member;
                }
            } else if (typeof member == 'function') {
                // add this mark to support callParent method
                member.$owner = cls;
                member.$name = name;
                cls.prototype[name] = member;
            } else {
                // add attribute cache to class
                cls.$attribute[name] = member;
            }
        });
        if (mixins !== null && mixins.length > 1) {
            addMembers(cls, $.extend.apply(null, mixins));
            cls.prototype.$self = cls;
        }
        if (inherit !== null) {
            extend(cls, inherit);
        }
    }
    function chain(obj) {
        var result = Object.create ? Object.create(obj) : (function (object) {
            var fn = function () {
            };
            fn.prototype = object;
            var result = new fn();
            fn.prototype = null;
            return result;
        })(obj);
        return $.extend(true, result, obj.$self.$attribute);
    }
    function extend(sub, base) {
        var prototype = chain(base.prototype);
        $.extend(true, prototype, sub.prototype);
        sub.prototype = prototype;
        // use $superclass for callParent method
        sub.$superclass = base.prototype;
        sub.$attribute = $.extend(true, {}, base.$attribute, sub.$attribute);
    }
    /**
     * Event
     */
    var Event = createClass('Event', {
    	// add event on the root el in a component
    	// simply use Jquery/Zepto's on method
    	addDomListener: function() {
    		var dom = this.rootElement;
    		dom.on.apply(dom, arguments);
    		return this;
    	},
    	removeDomListener: function() {
    		var dom = this.rootElement;
    		dom.off.apply(dom, arguments);
    		return this;
    	}
    });
    /**
     * Base
     */
    var Base = createClass('Base', {
        mixins: [Event],
        autoInit: true,
        rootElement: null,
        nodes: null,
        listeners: null,
        messages: null,
        init: function () {
        },
        bindEvent: function () {
            var me = this;
            var listeners = this.listeners || {};

            function _bind_(ls, fn) {
                if (typeof fn == 'function') {
                    me.addDomListener(ls, function (e) {
                        var ref = attr(me.rootElement, 'node-ref');
                        var element = $(e.target);
                        while (me != element.prop('owner') && !attr(element, 'node') && !attr(element, 'type')) {
                            if (ref && ( ref = $.trim(ref)) && (element.prop('tagName').toLowerCase() == ref.toLowerCase() || element.hasClass(ref))) {
                                element.$ref = true;
                                break;
                            }
                            element = element.parent();
                        }
                        fn.call(me, e, element, attr(element, 'node') || attr(element, 'type') || (element.$ref && ref) || null);
                    });
                }
            }

            eachPlainObject(listeners, function (ls, fn) {
                _bind_(ls, fn);
            });
        },
        destroy: function () {
            glue.destroy(this.id);
        },
        onMessage: function (name, data) {
        },
        callParent: function (args) {
            var method = this.callParent.caller;
            return method.$owner.$superclass[method.$name].apply(this, args || []);
        },
        updateComponentNodes: function () {
            var me = this;
            var nodes = find(me.rootElement, 'node').toArray().filter(function (oItem) {
                return parents($(oItem), 'component')[0] == me.rootElement[0];
            });
            me.nodes = {};
            var length = nodes.length;
            for (var i = 0; i < length; i++) {
                var node = $(nodes[i]);
                me.nodes[attr(node, 'node')] = node;
            }
        },
        updateNodes: function (options) {
            this.updateComponentNodes();
            Model.init(this);
            glue.initComponent(this.rootElement, options);
        }
    });
    /**
     * utility
     */
    function getObjectValue(obj, name) {
        // use the given name to get value from a object, name could be separated by '.', like a.b.c
        if (!name) {
            return null;
        }
        var comp = obj;
        var names = name.split('.');
        while ((name = names.shift()) !== undefined) {
            comp = comp[name];
            if (comp === undefined) {
                return undefined;
            }
        }
        return comp;
    }
    function setObjectValue(obj, name, cls) {
        // use the given name to set value to a object, name could be separated by '.', like a.b.c
        if (!name || !cls) {
            return;
        }
        var comp = obj;
        var names = name.split('.');
        var length = names.length - 1;
        for (var i = 0; i < length; i++) {
            name = names[i];
            if (!comp[name]) {
                comp[name] = {};
            }
            comp = comp[name];
        }
        comp[names[length]] = cls;
    }
    function removeObjectValue(obj, name) {
        // remove value from a object using the given name, name could be separated by '.', like a.b.c
        if (!name) {
            return;
        }
        var comp = obj;
        var names = name.split('.');
        var length = names.length - 1;
        for (var i = 0; i < length; i++) {
            name = names[i];
            if (comp[name] === undefined) {
                return;
            }
            comp = comp[name];
        }
        delete comp[names[length]];
    }
    function format(string, data) {
        // for error console
        string = string || '';
        data = data || [];
        return data.length === 0 ? '' : string.replace(/\{(\d+)\}/g, function () {
            return data[arguments[1]] || '';
        });
    }
    function error() {
        var message = format(glue.ERROR_FORMAT, arguments);
        throw message;
    }
    function find(node, name) {
        // find all children dom which has glue-|data- prefix attribute
        return node.find('[glue-' + name + '],[data-' + name + ']');
    }
    function parents(node, name) {
        // find all parent dom which has glue-|data- prefix attribute
        return node.parents('[glue-' + name + '],[data-' + name + ']');
    }
    function attr(node, name) {
        // get the glue-|data- prefix attribute
        return node.attr('glue-' + name) || node.attr('data-' + name);
    }
    function eachPlainObject(object, callback) {
        // iterate an object's property and ignore it's prototype property
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                callback.call(object, key, object[key]);
            }
        }
    }
    function parameter(fn) {
        // return a function's parameters in array, empty array if there is no any parameter
        if (typeof fn !== 'function') {
            return [];
        }
        fn = fn.toString().match(/function\s*\((.*?)\)/);
        if ($.trim(fn[1]) !== '') {
            return fn[1].replace(/\s+/g, '').split(',');
        }
        return [];
    }
    function decodeHtml(string) {
        // decode html which maybe has some escape characters
        var code = {
            '&quot;': '"',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&nbsp;': ' '
        };
        return string.replace(/&quot;|&amp;|&lt;|&gt;|&nbsp;/g, function () {
            return code[arguments[0]];
        });
    }
    /*
     * define an object's all property with set and get method
     * */
    function defineProperty(object) {
        function _define_(object, property) {
            // we just give no $ prefix property setter/getter method because of $property is native
            var key = property.substr(1);
            if (getObjectValue(object, key) === undefined) {
                Object.defineProperty(object, property.substr(1), {
                    get: function () {
                        var obj = object[property];
                        return obj.$node ? obj.$value : obj;
                    },
                    set: function (data) {
                        var obj = object[property];
                        if (obj.$node) {
                            if (data === obj.$value) {
                                return;
                            } else {
                                // set the data to the node by its attached directive
                                var oldValue = obj.$value;
                                obj.$value = data;
                                var length = obj.$node.length;
                                for (var i = 0; i < length; i++) {
                                    var item = obj.$node[i];
                                    item.$directive.execute(item.$nodes, item.$name, obj.$key, obj.$value, oldValue, obj.$model);
                                }
                            }
                        } else {
                            setProperty(obj, data);
                        }
                    }
                });
            }
        }

        // iterate the object to give every property setter/getter method
        eachPlainObject(object, function (key, value) {
            _define_(object, key);
            if (!value.$node) {
                defineProperty(value);
            }
        });
    }
    function setProperty(object, data) {
        if (!$.isPlainObject(data)) {
            error(glue.INVALID_DATA, 'not a plain object');
            return;
        }
        eachPlainObject(object, function (key, value) {
            // iterate the model object to determine if the property should has value
            if (key[0] === '$') {
                // this is default value for this property
                value = object[key].$key ? '' : {};
                // get the real key in the model
                key = key.substr(1);
                // if the given data does not give the property data, we set the default value for it
                object[key] = data[key] || value;
            }
        });
    }
    /**
     * Directive
     */
    var Directive = createClass('Directive', {
    	static: {
    		$GLUE_CLASS: 'glue-class',
    		$GLUE_ATTRIBUTE: 'glue-attribute',
    		$GLUE_BIND: 'glue-bind',
    		$GLUE_BIND_HTML: 'glue-bind-html',
    		$GLUE_SHOW: 'glue-show',
    		$GLUE_HIDE: 'glue-hide',
    		$GLUE_REPEAT: 'glue-repeat',
    		$directive: {},
    		getInstance: function(name) {
    			return Directive.$directive[name.toLowerCase()] ||
    				(name.indexOf('glue') < 0 ? Directive.$directive[Directive.$GLUE_ATTRIBUTE] : null);
    		},
    		create: function(name, options) {
    			var directive = new Directive();
    			$.extend(true, directive, options || {});
    			directive.$name = name;
    			Directive.$directive[directive.$name] = directive;
    		}
    	},
    	execute: function(element, name, key, newValue, oldValue, model) {},
    	compute: function(element, model) {
    		var values = [];
    		var count = 0;
    		var expression = element.attr(this.$name);
    		// explain the property like a.b.c
    		expression = 'return ' + expression.replace(/(\w[.\w]*)/g, function() {
    				var value = arguments[1];
    				if (isNaN(Number(value)) && arguments[3][arguments[2] - 1] != '\'') {
    					value = getObjectValue(model, value);
    					var param = 'arguments[' + (count++) + ']';
    					values.push(value || '');
    					return param;
    				}
    				return value;
    			});
    		return (new Function(expression)).apply(null, values);
    	}
    });
    /**
     * directive for attribute
     */
    Directive.create(Directive.$GLUE_ATTRIBUTE, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		element.attr(name, this.compute(element, model));
    	}
    });
    /**
     * directive for classname
     */
    Directive.create(Directive.$GLUE_CLASS, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		var newCls = this.compute(element, model);
    		element.removeClass(element.oldCls || '').addClass(newCls);
    		element.oldCls = newCls;
    	}
    });
    /**
     * directive for dom's hide action
     */
    Directive.create(Directive.$GLUE_HIDE, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		if (this.compute(element, model)) {
    			element.hide();
    		} else {
    			element.show();
    		}
    	}
    });
    /**
     * directive for dom's innerhtml
     */
    Directive.create(Directive.$GLUE_BIND_HTML, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		element.html(this.compute(element, model));
    	}
    });
    /**
     * directive for dom's innerText
     */
    Directive.create(Directive.$GLUE_BIND, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		element.text(this.compute(element, model));
    	}
    });
    /**
     * directive for list
     */
    Directive.create(Directive.$GLUE_REPEAT, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		if (!$.isArray(newValue)) {
    			error(glue.INVALID_DATA, 'repeat directive set need a array');
    			return;
    		}
    		var html = element.prop('outerHTML').replace(new RegExp(Directive.$GLUE_REPEAT + '=".*?"', 'g'), '');
    		var $length = newValue.length;
    		var result = '';
    		for (var $index = 0; $index < $length; $index++) {
    			var $first = $index === 0;
    			var $last = $index == $length - 1;
    			var $even = ($index + 1) % 2 === 0;
    			var $odd = ($index + 1) % 2 !== 0;
    			var data = newValue[$index];
    			result += this.compile(html, $index, $first, $last, $even, $odd, $length, data);
    		}
    		if ($length > 0) {
    			element.hide();
    			if (element[0].$ref) {
    				element[0].$ref.remove();
    			}
    			element[0].$ref = $(result);
    			element[0].$ref.show();
    			element[0].$ref.insertAfter(element);
    		}
    	},
    	compile: function(string, $index, $first, $last, $even, $odd, $length, data) {
    		return string.replace(/\{\{(.*)\}\}/g, function() {
    			var expression = $.trim(arguments[1]);
    			try {
    				return eval(expression);
    			} catch (e) {
    				(expression = expression.split('.')).shift();
    				return $.isPlainObject(data) ? getObjectValue(data, expression.join('.')) : data;
    			}
    		});
    	}
    });
    /**
     * directive for dom's show action
     */
    Directive.create(Directive.$GLUE_SHOW, {
    	execute: function(element, name, key, newValue, oldValue, model) {
    		if (this.compute(element, model)) {
    			element.show();
    		} else {
    			element.hide();
    		}
    	}
    });
    /**
     * Model
     */
    var Model = createClass('Model', {
    	static: {
    		init: function(component) {
    			if (!component.$model) {
    				(new Model()).init(component);
    			}
    			component.$model.updateModel();
    		}
    	},
    	$data: {},
    	$component: null,
    	init: function(component) {
    		this.$component = component;
    		component.$model = this;
    		if (!component.model) {
    			// give the model object setter/getter method
    			Object.defineProperty(component, 'model', {
    				get: function () {
    					return component.$model.$data;
    				},
    				set: function (data) {
    					setProperty(component.$model.$data, data);
    				}
    			});
    		}
    	},
    	updateModel: function() {
    		var me = this;
    		var rootElement = this.$component.rootElement;
    		// first we clone this component's dom and remove any sub component in it
    		var cloneComp = rootElement.clone();
    		find(cloneComp, 'component').remove();
    		var html = decodeHtml(cloneComp.prop('outerHTML'));
    		var reg = /(\S+)="[^="]*?\{\{(.*?)\}\}.*?"|(glue-\S+)="(.*?)"/ig;
    		var tag = {};
    		var r = reg.exec(html);
    		while (r) {
    			// use a tag to mark if this directive has initialed in this component
    			if (!tag[r[0]]) {
    				tag[r[0]] = true;
    				var name = r[1] || r[3];
    				var key = $.trim(r[2] || r[4]);
    				var directive = Directive.getInstance(name);
    				if (directive) {
    					// find all the dom nodes attached by this directive
    					var nodes = rootElement.find('[' + r[0] + ']').toArray().filter(_filter_);
    					var item = {
    						$nodes: nodes.length === 0 ? rootElement : $(nodes),
    						$name: name,
    						$directive: directive
    					};
    					key = name == Directive.$GLUE_REPEAT ? key.split(' ').pop() : key;
    					key.replace(/(\w[.\w]*)/g, _replace_);
    				}
    			}
    			r = reg.exec(html);
    		}
    		function _filter_(oItem) {
    			oItem = $(oItem);
    			if (!oItem.attr(Directive.$GLUE_REPEAT) && parents(oItem, 'repeat').length > 0) {
    				return false;
    			}
    			return parents(oItem, 'component')[0] == rootElement[0];
    		}
    		function _replace_() {
    			var arg = arguments[1];
    			if (isNaN(Number(arg)) && arguments[3][arguments[2] - 1] != '\'') {
    				if (tag[arg]) {
    					getObjectValue(me.$data, '$' + arg.replace(/\./g, '.$')).$node.push(item);
    				} else {
    					tag[arg] = true;
    					setObjectValue(me.$data, '$' + arg.replace(/\./g, '.$'), {
    						$node: [item],
    						$model: me.$component.$model.$data,
    						$key: arg,
    						$value: ''
    					});
    				}
    			}
    		}
    		defineProperty(this.$data);
    	}
    });
    /**
     * History
     */
    var History = createClass('History', {
        static: {
            handlers: [],	// cache all the routes for url's change,
            fragment: null, // record current fragment like hash or path/search?
            init: function (options) {
                options = options || {};
                options.trigger = options.trigger !== false;
                // regular the root path to ensure it has a leading slash and a trailing slash like /a/b/c/, the default is /
                History.root = ('/' + options.root || '/' + '/').replace(/^\/+|\/+$/g, '/');
                History.useHashChange = options.useHashChange !== false;
                History.usePushState = options.usePushState !== false;
                if (History.useHashChange) {
                    window.addEventListener('hashchange', History.route, false);
                } else if (History.usePushState) {
                    window.addEventListener('popstate', History.route, false);
                }
                // maybe the url has route when it first load
                History.navigate();
            },
            getFragment: function (fragment) {
                if (!fragment) {
                    if (History.useHashChange) {
                        var hash = window.location.hash;
                        fragment = hash !== '' ? hash.substring(1) : '';
                    } else if (History.usePushState) {
                        var path = (window.location.pathname + window.location.search).substring(History.root.length - 1);
                        fragment = path.charAt(0) === '/' ? path.substring(1) : path;
                    }
                }
                // remove all the leading hash/slash and trailing space
                return fragment.replace(/^[#\/]*|\s+$/g, '');
            },
            navigate: function (fragment, options) {
                options = options || {};
                options.replce = !!options.replce;
                options.trigger = options.trigger !== false;
                fragment = History.getFragment(fragment);
                if (fragment !== History.fragment) {
                    if (History.useHashChange) {
                        if (options.replce) {
                            var href = window.location.href.replace(/#.*$/, '');
                            window.location.replace(href + '#' + fragment);
                        } else {
                            window.location.hash = '#' + fragment;
                        }
                    } else if (History.usePushState) {
                        var root = History.root;
                        if (fragment === '' || fragment.charAt(0) === '?') {
                            // remove the trailing slash
                            root = root.slice(0, -1) || '/';
                        }
                        var url = root + fragment;
                        window.history[options.replce ? 'replaceState' : 'pushState'](options.state || {}, document.title, url);
                    }
                    if (options.trigger) {
                        History.route(fragment);
                    }
                }
            },
            addRoute: function (routeRegExp, handler) {
                if (routeRegExp instanceof RegExp && typeof handler === 'function') {
                    History.handlers.push({routeRegExp: routeRegExp, handler: handler});
                }
            },
            route: function (fragment) {
                fragment = typeof fragment === 'string' ? fragment : History.getFragment();
                if (History.fragment === fragment) {
                    // this could be happened when navigate change the location.hash and trigger is true
                    return;
                }
                History.fragment = fragment;
                var handlers = History.handlers;
                var length = handlers.length;
                for (var i = 0; i < length; i++) {
                    // for every matched route, the handler will be called one by one
                    var handler = handlers[i];
                    if (handler.routeRegExp.test(fragment)) {
                        handler.handler.apply(null, Route.parseParameters(handler.routeRegExp, fragment));
                    }
                }
            }
        }
    });
    /**
     * Route
     */
    var Route = createClass('Route', {
        static: {
            init: function (options) {
                if (!options || !options.routes) {
                    return;
                }
                var routes = options.routes;
                var scope = options.scope || window;
                eachPlainObject(routes, function (r, handler) {
                    if (typeof handler === 'string' && typeof options[handler] === 'function') {
                        handler = options[handler];
                    }
                    if (typeof handler === 'function') {
                        var routeRegExp = Route.createRouteRegExp(r);
                        History.addRoute(routeRegExp, handler.bind(scope));
                    }
                });
            },
            createRouteRegExp: function (route) {
                // Convert a route string into a regular expression, match the hash and search parameters
                route = route
                // escape the regular expression and remove the leading /
                    .replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&').replace(/^\/*/g, '')
                    // optional parameter, like a/:b(/:c)
                    .replace(/\((.*?)\)/g, '(?:$1)?')
                    // parameter, like a(/:b)/:c?d=:d&e=:e
                    .replace(/(\(\?)?:\w+/g, function (match, subexpr) {
                        // subexpr will match the (?:$1)
                        return subexpr ? match : '([^/?]+)';
                    })
                    // wildcard, like a/* or a/*anything
                    .replace(/\*\w*.*$/g, '([^?]*?)');
                return new RegExp('^' + route + '$');
            },
            parseParameters: function (routeRegExp, fragment) {
                var params = routeRegExp.exec(fragment);
                if (params === null) {
                    return null;
                }
                var result = [];
                var length = params.length;
                for (var i = 1; i < length; i++) {
                    var param = params[i];
                    result.push(param ? decodeURIComponent(param) : null);
                }
                return result;
            },
            route: function (fragment, options) {
                History.navigate(fragment, options);
            }
        }
    });
    /**
     * Core
     */
    var glue = window.APP = window.glue = {};
    glue.COMPONENTS = {};	// save all defined components with namespace
    glue.COMPS = {};		// save all components' instance with namespace
    glue.OBJ_POINTER = [];	// save all components' instance in array for quickly search
    glue.SERVICES = {};	// save all the services' instance
    glue.BEHAVIORS = {};	// save all the behaviors' instance
    glue.idSeed = 0;
    glue.isReady = false;		// sign for all components are ready to use
    glue.readyCall = [];		// cache callback function if glue.isReady is false
    glue.readyMsg = [];		// cache globle message if glue.isReady is false
    glue.debug = false;
    glue.console = window.console || {
            log: function (message) {
                alert(message);
            }
        };
    glue.ERROR_FORMAT = 'error: {0} [name={1}] {2}';
    glue.DUPLICATED_DEFINE = 'duplicated define component';
    glue.DUPLICATED_CREATE_COMPONENT = 'duplicated create component';
    glue.DUPLICATED_CREATE_SERVICE = 'duplicated create service';
    glue.DUPLICATED_CREATE_BEHAVIOR = 'duplicated create behavior';
    glue.DUPLICATED_CREATE_DIRECTIVE = 'duplicated create directive';
    glue.INIT_COMPONENT_ERROR = 'init component failed';
    glue.GET_COMPS_ERROR = 'get comps failed';
    glue.INVALID_DATA = 'invalid data';
    glue.NAMEOFSERVICE = 'SERVICE';
    glue.$ = window.jQuery || window.Zepto;

    // define component
    glue.define = function (name, members, injection) {
        var cls = getObjectValue(glue.COMPONENTS, name);
        if (!cls) {
            members = $.extend(true, members || {}, {extend: Base});
            cls = createClass(name, members);
            injection = injection || [];
            if (!(injection instanceof Array)) {
                injection = [injection];
            }
            cls.$injection = injection;
            setObjectValue(glue.COMPONENTS, name, cls);
            return cls;
        }
        error(glue.DUPLICATED_DEFINE, name);
        return null;
    };
    // create component
    glue.create = function (rootElement, options) {
        var name = attr(rootElement, 'component');
        var cls = getObjectValue(glue.COMPONENTS, name);
        if (cls) {
            var oComp = getObjectValue(glue.COMPS, attr(rootElement, 'id'));
            if (oComp && oComp.rootElement != rootElement) {
                // if exist the same id component, destroy it first, this could be happened by use innerHTML to change some dom
                oComp.destroy();
                oComp = null;
            }
            if (!oComp) {
                cls = new cls();
                // accept the options defined in glue.init() function by the id key
                $.extend(true, cls, options[attr(rootElement, 'id')] || {});
                var id = attr(rootElement, 'id') || rootElement.attr('id') || (name + '_' + glue.idSeed++);
                cls.id = id;
                rootElement.attr('glue-id', id);
                setObjectValue(glue.COMPS, id, cls);
                glue.OBJ_POINTER.push(cls);
                rootElement.prop('owner', cls);
                cls.rootElement = rootElement;
                cls.updateNodes(options);
            } else {
                error(glue.DUPLICATED_CREATE_COMPONENT, name);
                cls = null;
            }
        }
        return cls;
    };
    // destroy a component by it's id, at the same time, delete it's relative dom
    glue.destroy = function (id) {
        var comp = getObjectValue(glue.COMPS, id);
        if (comp) {
            comp.rootElement.remove();
            removeObjectValue(glue.COMPS, id);
            var length = glue.OBJ_POINTER.length;
            for (var i = 0; i < length; i++) {
                if (glue.OBJ_POINTER[i] == comp) {
                    glue.OBJ_POINTER.splice(i, 1);
                    break;
                }
            }
        } else {
            error(glue.GET_COMPS_ERROR, id);
        }
    };
    // get the instance of a component by it's id
    glue.getComponentInstance = function (id) {
        if (typeof id != 'string') {
            id = attr($(id), 'id') || $(id).attr('id');
        }
        return getObjectValue(glue.COMPS, id);
    };
    // create service, it's a object and need not to use new to create
    glue.createService = function () {
        var name = '';
        var members = {};
        if (arguments.length === 0) {
            return null;
        } else if (arguments.length === 2) {
            name = arguments[0];
            members = arguments[1];
        } else {
            name = glue.NAMEOFSERVICE + glue.idSeed++;
            members = arguments[0];
        }

        if (!getObjectValue(glue.SERVICES, name)) {
            var service = {};
            $.extend(true, service, members || {});
            setObjectValue(glue.SERVICES, name, service);
            return service;
        } else {
            error(glue.DUPLICATED_CREATE_SERVICE, name);
            return null;
        }
    };
    // create behavior, a function or an object
    glue.createBehavior = function (name, fn) {
        if (!fn) {
            return;
        }
        if (name && !getObjectValue(glue.BEHAVIORS, name)) {
            setObjectValue(glue.BEHAVIORS, name, fn);
            if (typeof fn == 'object') {
                glue.OBJ_POINTER.push(fn);
            }
        } else {
            error(glue.DUPLICATED_CREATE_BEHAVIOR, name);
        }
    };
    // create directive
    glue.createDirective = function (name, options) {
        if (name && !Directive.$directive[name]) {
            Directive.create(name, options);
        } else {
            error(glue.DUPLICATED_CREATE_DIRECTIVE, name);
        }
    };
    // create route
    glue.createRoute = function (options) {
        Route.init(options);
    };
    // load a new route
    glue.changeRoute = function (fragment, options) {
        Route.route(fragment, options);
    };
    // post message
    glue.postMessage = function (name, data) {
        if (!glue.isReady) {
            // cache the message if all the components has not been instanced done
            glue.readyMsg.push({
                name: name,
                data: data
            });
            return;
        }
        name = name instanceof Array ? name : [name];
        var nameLength = name.length;
        var length = glue.OBJ_POINTER.length;
        for (var i = 0; i < length; i++) {
            // for every component, we check if it has subscribe the message, if true then call that process
            var obj = glue.OBJ_POINTER[i];
            if (obj.message instanceof Array && obj.onMessage) {
                for (var j = 0; j < nameLength; j++) {
                    if (obj.message.indexOf(name[j]) >= 0) {
                        obj.onMessage(name[j], data);
                    }
                }
            }
        }
    };
    // init the components in the html dom
    glue.initComponent = function (root, options) {
        root = $(root);
        options = options || {};
        var comps = find(root, 'component');
        var length = comps.length;
        for (var i = 0; i < length; i++) {
            var comp = $(comps[i]);
            var obj = comp.prop('owner');
            if (!obj) {
                obj = glue.create(comp, options);
            }
            if (obj && !obj.$init) {
                if (obj.autoInit) {
                    var services = glue._initService_(obj);
                    if (glue.debug) {
                        obj.init.apply(obj, services);
                    } else {
                        try {
                            obj.init.apply(obj, services);
                        } catch (e) {
                            error(glue.INIT_COMPONENT_ERROR, attr(comp, 'component'), e.message);
                        }
                    }
                }
                obj.bindEvent();
                obj.$init = true;
                var behavior = attr(comp, 'behavior');
                if (behavior) {
                    glue._initBehavior_(behavior, obj);
                }
            }
        }
    };
    glue._initService_ = function (instance) {
        var services = [];
        var injection = instance.$self.$injection;
        var initFn = instance.init;
        instance.service = {};
        injection = injection.length > 0 ? injection : parameter(initFn);
        for (var i = 0, length = injection.length; i < length; i++) {
            var inject = injection[i];
            var service = getObjectValue(glue.SERVICES, inject) || null;
            instance.service[inject] = service;
            services.push(service);
        }
        return services;
    };
    glue._initBehavior_ = function (behavior, instance) {
        var behaviors = behavior.replace(/,/g, ';').split(';');
        var length = behaviors.length;
        for (var i = 0; i < length; i++) {
            behavior = getObjectValue(glue.BEHAVIORS, $.trim(behaviors[i]));
            if (typeof behavior == 'function') {
                behavior.call(instance);
            } else if (typeof behavior == 'object' && typeof behavior.init == 'function') {
                behavior.init.call(instance);
            }
        }
    };
    glue._done_ = function (options) {
        glue.isReady = true;
        while ((fn = glue.readyCall.shift()) !== undefined) {
            fn.call();
        }
        var length = glue.readyMsg.length;
        for (var i = 0; i < length; i++) {
            var msg = glue.readyMsg[i];
            glue.postMessage(msg.name, msg.data);
        }
        History.init(options);
    };
    // a callback function when all the components has been instanced done
    glue.ready = function (fn) {
        if (glue.isReady) {
            fn.call();
        } else if (typeof fn == 'function') {
            glue.readyCall.push(fn);
        }
    };
    // entrance in use glue
    glue.init = function (options) {
        $(document).ready(function () {
            options = options || {};
            glue.debug = !!options.debug;
            glue.initComponent($('body'), options);
            glue._done_(options);
        });
    };
    /**
     * åˆ›å»ºstore
     */
    glue.createDataStore = function (members) {
        var store = $.extend(true, {}, members || {}),
            watchers = [];

        var dataStore = {
            set: set,
            get: get,
            watch: watch
        };
        return dataStore;

        function set(key, value) {
            var oldValue = store;
            var newValue = {};
            $.extend(true, newValue, oldValue);
            newValue[key] = value;
            store = newValue;

            if (isEqual(newValue, oldValue)) {
                return;
            }

            watchers.forEach(function (watcher) {
                var oldData = oldValue;
                var newData = newValue;
                var oldHasData = true;
                var newHasData = true;
                watcher.key.split('.').forEach(function (key) {
                    if (oldData && oldData.hasOwnProperty(key)) {
                        oldData = oldData[key];
                    } else {
                        oldHasData = false;
                        oldData = undefined;
                    }
                    if (newData && newData.hasOwnProperty(key)) {
                        newData = newData[key];
                    } else {
                        newHasData = false;
                        newData = undefined;
                    }
                });
                if ((oldHasData !== newHasData) || !isEqual(newData, oldData)) {
                    watcher.fn(newData, oldData);
                }
            });
        }

        function get(key) {
            var data = store[key], result = data;
            if (isObject(data)) {
                result = {};
                $.extend(true, result, data);
            } else if (isArray(data)) {
                result = [];
                $.extend(true, result, data);
            }
            return result;
        }

        function watch(key, fn) {
            if (key && fn) {
                watchers.push({
                    key: key.replace(/^\s*|\s*$/g, ''),
                    fn: fn
                });
            }
        }

        function getTag(obj) {
            return Object.prototype.toString.call(obj);
        }

        function isObject(obj) {
            return getTag(obj) === '[object Object]';
        }

        function isObjectLike(obj) {
            return typeof obj === 'object';
        }

        function isArray(arr) {
            return getTag(arr) === '[object Array]';
        }

        function isEqual(value, other) {
            if (value === other) {
                return true;
            }
            if (value === null || other === null || (!isObjectLike(value) && !isObject(value))) {
                return value !== value && other !== other;
            }
            return equalDeep(value, other);
        }

        function equalDeep(object, other) {
            var objTag = getTag(object);
            var otherTag = getTag(object);
            var isSameTag = objTag === otherTag;
            if (!isSameTag) {
                return false;
            }
            if (isObject(object)) {
                return equalObject(object, other);
            }
            if (isArray(object)) {
                return equalArray(object, other);
            }
        }

        function equalObject(object, other) {
            var keys = Object.keys(object);
            var otherKeys = Object.keys(other);
            if (keys.length !== otherKeys.length) {
                return false;
            }
            var length = keys.length;
            while (length--) {
                var key = keys[length];
                if (!isEqual(object[key], other[key])) {
                    return false;
                }
            }
            return true;
        }

        function equalArray(array, other) {
            var arrayLength = array.length;
            var otherLength = other.length;
            if (arrayLength !== otherLength) {
                return false;
            }
            while (arrayLength--) {
                if (!isEqual(array[arrayLength], other[arrayLength])) {
                    return false;
                }
            }
        }
    };
/**
 * autorun function end block
 */
})();
