

"use strict";

var EDITOR = {
    /**************************************
    * Properties
    **************************************/
    menuHeight:40,
    height:'600px',
    fsHeight:'1000px',
    props:{
        s:'@props',
        e:'@endProps'
    },
    strip:function(c) {
        if (!c) return;
        var start = c.indexOf(EDITOR.props.s);
        var end = c.indexOf(EDITOR.props.e);
        if (start !== -1 || end !== -1) return c.substring(end + EDITOR.props.e.length);
        else return c;
    },
    /**************************************
    * Functions
    **************************************/
    init:function(update) {
        var modeLookup = {
            html:'htmlmixed',
            css:'css',
            js:'javascript'
        };
        var settings = [
            {
                label:'<i class="fa fa-expand"></i>',
                action:function(index) {
                    var example = examples[index];
                    var toggle = example.div.classList.toggle('fullscreen');
                    var h = EDITOR.fsHeight =
                        (EDITOR.fsHeight - EDITOR.menuHeight) + 'px';
                    example.editor.getTextArea().nextSibling.style.height = h;
                    example.iframe.style.height = h;
                    previewCode(example);
                }
            },
        ];

        var examples = document.querySelectorAll('.coderific');
        examples = Array.prototype.slice.call(examples);
        examples = examples.map(function(example, index) {
            //FIGURE OUT TABS AND CONTENT
            var children = Array.prototype.slice.call(example.children);
            var content = [];
            var tabProps = [];
            tabProps.push({name:'<i class="fa fa-play"></i>'});
            while(children.length > 0) {
                var code = children.splice(0, 1)[0];
                tabProps.push({
                    name:code.getAttribute('name'),
                    type:code.getAttribute('type'),
                    stype:code.getAttribute('stype'),
                    hidden:code.getAttribute('hidden')
                });
                content.push(window.location.pathname.indexOf('writer') === -1 ? EDITOR.strip(code.value) : code.value);
                if (children.length > 0) code.remove();
            }
            tabProps.push({
                name:'<i class="fa fa-cog"></i>'
            });
            
            //zero this array so we don't make any tabs
            var notabs = example.getAttribute('notabs');
            if (notabs) tabProps = [];
            
            //MAKE TABS HERE
            var nav = document.createElement('ul');
            var tabs = [];
            nav.classList.add('example-nav');
            for (var i in tabProps) {
                var tab = document.createElement('li');
                tab.innerHTML = tabProps[i].name;
                if (tabProps[i].hidden) tab.style.display = 'none';
                tabs.push(tab);
                nav.appendChild(tab);
                if (i == tabProps.length-1) {
                    tab.classList.add('settings');
                    var sub = document.createElement('ul');
                    tab.appendChild(sub);
                    for (var j in settings) {
                        
                        (function() {
                            var subEl = document.createElement('li');
                            var sIndex = j;
                            subEl.innerHTML = settings[j].label;
                            subEl.onclick = function() {
                                settings[sIndex].action(index);
                            };
                            sub.appendChild(subEl);
                        }());
                        
                    }
                    continue;
                }
                
                //console.log(content[i-1]);
                
                //action
                if (i == 0
                    || window.location.pathname.indexOf('writer') !== -1
                    || content[i-1].indexOf('@disabled') === -1) {
                    //add tab functionality only if not writer and not disabled
                    (function() {
                        var tabIndex = i;
                        tab.onclick = function() {
                            updateExample(index, tabIndex);
                        }
                    }());
                } else {
                    //hide tab
                    tab.classList.add('disabled');
                }
            }
            //make editor
            var editor = CodeMirror.fromTextArea(example.children[0], {
                lineNumbers:true,
                mode:'text/processing'
            });
            //editor updating content
            var timeout;
            editor.on('update', function() {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(function() {
                    var value = editor.getValue();
                    content[examples[index].visible - 1] = value;
                    if (update) update(index, examples[index].visible - 1, value);
                }, 500);
            });
            //add nav
            example.insertBefore(nav, editor.getTextArea());
            //add iframe
            var iframe = document.createElement('iframe');
            example.insertBefore(iframe, editor.getTextArea());
            //return example object
            return {
                div:example,
                iframe:iframe,
                editor:editor,
                visible:0,
                tabs:tabs,
                tabProps:tabProps,
                content:content,
                notabs:notabs
            }
        });
        
        var updateExample = function(which, tab) {
            var example = examples[which];
            
            if (example.notabs) {
                //example.editor.setOption('mode', 'text/x-java');
                example.editor.getDoc().setValue(example.content[0]);
                document.querySelectorAll('.CodeMirror')[which].style.left = '0px';
                example.iframe.style.left = '-9999px';
                return;
            }
            
            example.visible = tab;
            example.tabs.forEach(function(tab) { tab.classList.remove('active'); });
            example.tabs[tab].classList.add('active');
            if (tab != 0) {
                //example.editor.setOption('mode', modeLookup[example.tabProps[tab].type] || 'javascript');
                example.editor.getDoc().setValue(example.content[tab-1]);
                document.querySelectorAll('.CodeMirror')[which].style.left = '0px';
                example.iframe.style.left = '-9999px';
            } else {
                document.querySelectorAll('.CodeMirror')[which].style.left = '-9999px';
                example.iframe.style.left = '0px';
                previewCode(example);
            }
        };
        
        var previewCode = function(example) {
            
            if (example.notabs) return;
            //get code
            var html = EDITOR.strip(example.content[0]),
            css = EDITOR.strip(example.content[1]);
            //get iframe document
            var editor = example.editor,
                oldframe = example.iframe,
                iframe = document.createElement('iframe');
            oldframe.parentNode.replaceChild(iframe, oldframe);
            example.iframe = iframe;
            //get doc
            var doc = iframe.contentWindow.document;
            //wipe out iframe and set a new src
            var src = html.substring(0, html.indexOf('</body>'));
            
            //processing
            
            var psrc = 'void setup() { size(800, 600); background(255); main(); }';
            for (var i = 2; i < example.content.length; i++)
                psrc += EDITOR.strip(example.content[i]);
                
                
                
            src += '<textarea id="psrc" style="display:none">' + psrc + '</textarea>'
                + '<script>window.onload = function() {'
                + 'var psrc = document.getElementById("psrc").value;'
                + 'var processing = new Processing(document.getElementById("canvas"), psrc)'
                + '}; //onload'
                + '<\/script>';
            
            
            if (false) {
                //regular js
                var concat = (i) => {
                    var stype = example.tabProps[i + 1].stype;
                    src += '<script type="'
                    + (!stype || stype == 'undefined' ? 'text/javascript' : stype)
                    + '">'
                    + EDITOR.strip(example.content[i]) + '<\/script>';
                };
                for (var i = 3; i < example.content.length; i++)
                    concat(i);
                concat(2);
            }
            
            
            src += '</body></html>';
            
            //set styles
            var headLoc = src.indexOf('</head>');
            src = src.substring(0, headLoc) + '<style>' + css + '</style>' + src.substring(headLoc + 7);
            //iframe size
            var rect = editor.display.wrapper.getBoundingClientRect(),
                w = rect.width + 'px',
                h = rect.height + 'px';

            iframe.style.width = w
            iframe.style.height = h;
            try {
                doc.open();
                doc.write(src);
                doc.close();
            } catch (e) {
                console.log(e);
            }
        };
        
        //run preview
        examples.forEach(function(example, i) {
           updateExample(i, 3);
           settings[0].action(i);
        });
    }
}

var videoMode = function() {
    var a = document.querySelector('article');
    a.style.marginLeft = '32px';
    a.style.width = '928px';
}
