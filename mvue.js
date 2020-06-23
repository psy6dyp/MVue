class MVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        this.$option = options;
        if (this.$el) {
            // 指令解析器
            new Compile(this.$el, this);
        }
    }
}
compileUtil = {
    text(node, expr, vm) {
        let value;
        if (expr.includes('{{') && expr.includes('}}')) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getVal(args[1].trim(), vm);
            })
        } else {
            value = this.getVal(expr, vm);
        }
        // expr: 比如msg 
        this.updater.textUpdater(node, value);
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm);
        // expr: 比如msg 
        this.updater.htmlUpdater(node, value);
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm);
        // expr: 比如msg 
        this.updater.modelUpdater(node, value);
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$option.methods && vm.$option.methods[expr];
        node.addEventListener(eventName, fn.bind(vm), false);
    },
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, vm.$data);
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value;
        },
        htmlUpdater(node, value) {
            node.innerHTML = value;
        },
        modelUpdater(node, value) {
            node.value = value;
        }
    }
}
class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        // 1.获取文档碎片对象，放入内存中减少页面的回流重绘
        let fragment = this.node2Fragment(this.el);
        // 2.编译模板
        this.compile(fragment);
        // 3.追加到根元素
        this.el.appendChild(fragment);
    }
    compile(fragment) {
        // 1.获取每一个子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child => {
            // console.log(child);
            if (this.isElementNode(child)) {
                // 元素节点
                // console.log('元素节点', child);
                this.compileElement(child);
            } else {
                // 文本节点
                // console.log('文本节点', child);
                this.compileText(child);
            }
            // 递归遍历元素里的元素
            if (child.childNodes && child.childNodes.length) {
                this.compile(child);
            }
        })
    }
    compileElement(node) {
        // 属性
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            const {name, value} = attr;
            if (this.isDirective(name)) {
                // 是v指令 v-text v-html v-model v-on:click
                // 结构出了 text html model on:click
                const [,directive] = name.split('-');
                // 结构出了 text html model on 和事件名 click
                const [dirName, eventName] = directive.split(':')
                // console.log(dirName, eventName);
                // 执行指令
                compileUtil[dirName](node, value, this.vm, eventName);
                // 删除指令的属性
                node.removeAttribute('v-' + directive)
            } else if (this.isEventName(name)) {
                // 判断是不是@click="xxx"
                let [, eventName] = name.split('@');
                compileUtil.on(node, value, this.vm, eventName)
            }
        })
    }
    isEventName(attrName) {
        return attrName.startsWith('@');
    }
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    compileText(node) {
        const content = node.textContent;
        if (/\{\{(.+?)\}\}/g.test(content)) {
            compileUtil['text'](node, content, this.vm);
        }
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
    node2Fragment(el) {
        let f = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild) {
            f.appendChild(firstChild);
        }
        return f;
    }
}