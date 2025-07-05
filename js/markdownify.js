(function(document) {
    const specialThemePrefix = 'special_'
    let mpp = {
        markedLoaded: 0
    }

    var interval,
        defaultReloadFreq = 3,
        previousText,
        toc = [],
        storage = chrome.storage.local;

    // 检查扩展上下文是否有效的工具函数
    function isExtensionContextValid() {
        try {
            return !!(chrome && chrome.runtime && chrome.runtime.id);
        } catch (e) {
            return false;
        }
    }

    // 显示扩展状态的提示
    function showExtensionStatus() {
        if (!isExtensionContextValid()) {
            console.warn('Extension context is invalid. Some features may not work properly.');
            console.log('If you see this message, try refreshing the page or reloading the extension.');
            
            // 在页面顶部显示用户友好的提示
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #fff3cd;
                color: #856404;
                padding: 10px;
                border-bottom: 1px solid #ffeaa7;
                z-index: 9999;
                font-family: Arial, sans-serif;
                font-size: 14px;
                text-align: center;
                cursor: pointer;
            `;
            notification.innerHTML = `
                <strong>Markdown Preview Plus:</strong> 
                Extension context lost. Please refresh the page (F5) or reload the extension in chrome://extensions/
                <span style="float: right; font-weight: bold;">&times;</span>
            `;
            
            notification.onclick = function() {
                notification.remove();
            };
            
            document.body.insertBefore(notification, document.body.firstChild);
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
        }
    }

    mpp.isText = () => {
        var value = document.contentType;
        return value && /text\/(?:x-)?(markdown|plain)/i.test(value);
    };

    mpp.ajax = options => {
        // 检查扩展上下文是否有效
        try {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                throw new Error('Extension context invalidated');
            }
            
            chrome.runtime.sendMessage({message: "autoreload", url: options.url}, response => {
                // 检查是否有运行时错误
                if (chrome.runtime.lastError) {
                    console.warn('Chrome runtime error:', chrome.runtime.lastError.message);
                    // 使用备用方案
                    const fallbackResponse = {
                        data: document.body.innerText,
                        success: true,
                        fromFallback: true
                    };
                    options.complete(fallbackResponse);
                    return;
                }
                
                if (response && response.success) {
                    options.complete(response);
                } else {
                    // 如果fetch失败，尝试从document.body直接读取
                    console.warn('Failed to fetch file via background script:', response?.error || 'Unknown error');
                    console.log('Attempting to read from document.body directly...');
                    
                    // 使用document.body.innerText作为备用方案
                    const fallbackResponse = {
                        data: document.body.innerText,
                        success: true,
                        fromFallback: true
                    };
                    options.complete(fallbackResponse);
                }
            });
        } catch (error) {
            console.warn('Extension context error:', error.message);
            console.log('Using direct document.body content...');
            
            // 直接使用document.body内容作为备用方案
            const fallbackResponse = {
                data: document.body.innerText,
                success: true,
                fromFallback: true
            };
            options.complete(fallbackResponse);
        }
    };

    function getExtension(url) {
        url = url.substr(1 + url.lastIndexOf("/"))
            .split('?')[0]
            .split('#')[0];
        var ext = url.substr(1 + url.lastIndexOf("."));
        return ext.toLowerCase();
    }

    function hasValue(obj, key) {
        return obj && 
           obj.hasOwnProperty(key) && 
           $.trim(obj[key]).length > 0;
    }

    function resolveImg(img) {
        var src = $(img).attr("src");
        if (src[0] == "/") {
            $(img).attr("src", src.substring(1));
        }
    }

    function postRender() {
        if (location.hash) {
            window.setTimeout(function() {
                var target = $(location.hash);
                if (target.length == 0) {
                    target = $('a[name="' + location.hash.substring(1) + '"]');
                }
                if (target.length == 0) {
                    target = $('html');
                }
                $('html, body').animate({
                    scrollTop: target.offset().top
                }, 200);
            }, 300);

        }
    }

    var buildCtx = (coll, k, level, ctx) => {
        if (k >= coll.length || coll[k].level <= level) { return k; }
        var node = coll[k];
        ctx.push("<li><a href='#" + node.anchor + "'>" + node.text + "</a>");
        k++;
        var childCtx = [];
        k = buildCtx(coll, k, node.level, childCtx);
        if (childCtx.length > 0) {
            ctx.push("<ul>");
            childCtx.forEach(function (idm) {
                ctx.push(idm);
            });
            ctx.push("</ul>");
        }
        ctx.push("</li>");
        k = buildCtx(coll, k, level, ctx);
        return k;
    };

    function initMarked() {
        if (mpp.markedLoaded) {
            return
        }

        marked.setOptions(config.markedOptions);
        marked.use(markedHighlight({
          langPrefix: 'hljs language-',
          highlight(code, lang) {
            return hljs.highlightAuto(code).value;
          }
        }));

        mpp.markedLoaded = true
    }

    // Onload, take the DOM of the page, get the markdown formatted text out and
    // apply the converter.
    function makeHtml(data) {
        storage.get(['supportMath', 'katex', 'toc'], function(items) {
            // Convert MarkDown to HTML
            var preHtml = data;
            if (items.katex) {
                config.markedOptions.katex = true;
                preHtml = diagramFlowSeq.prepareDiagram(preHtml);
            }

            if (items.toc) {
                toc = [];
                const renderer = new marked.Renderer()
                const slugger = new marked.Slugger()
                const r = {
                  heading: renderer.heading.bind(renderer),
                };

                renderer.heading = (text, level, raw, slugger) => {
                    var anchor = config.markedOptions.headerPrefix + slugger.serialize(raw)

                    toc.push({
                        anchor: anchor,
                        level: level,
                        text: text
                    });

                    return r.heading(text, level, raw, slugger);
                };
                config.markedOptions.renderer = renderer;
            }

            initMarked()
            var html = marked.parse(preHtml);
            html = DOMPurify.sanitize(html, {
                ADD_ATTR: ['flow'],
                SANITIZE_DOM: false
            });
            if (items.toc) {
                var ctx = [];
                ctx.push('<div class="toc-list"><h1 id="table-of-contents">Table of Contents</h1>\n<ul>');
                buildCtx(toc, 0, 0, ctx);
                ctx.push("</ul></div>");
                html = ctx.join('') + html
            }
            $(document.body).html(html);
            $('img').on("error", () => resolveImg(this));
            diagramFlowSeq.drawAllMermaid();
            postRender();
        });
    }

    function getThemeCss(theme) {
        try {
            if (!chrome.runtime || !chrome.runtime.getURL) {
                throw new Error('Extension context invalidated');
            }
            return chrome.runtime.getURL('theme/' + theme + '.css');
        } catch (error) {
            console.warn('Extension context error in getThemeCss:', error.message);
            // 返回一个备用的CSS URL或者空字符串
            return '';
        }
    }

    function insertCssPaths(paths) {
        let cssClass = 'CUSTOM_CSS_PATH'
        $('.' + cssClass).remove()
        paths.forEach(css => {
            let cssLink = $('<link/>').addClass(cssClass)
            cssLink
                .attr('rel', 'stylesheet')
                .attr('href', css)
                .attr('charset', 'UTF-8')
            $(document.head).append(cssLink)
        })
    }

    function insertThemeCss(theme) {
        if (hasValue(config.themes, theme)) {
            var link = $('#theme')
            $('#custom-theme').remove();
            if(!link.length) {
                var ss = document.createElement('link');
                ss.rel = 'stylesheet';
                ss.id = 'theme';
                ss.href = getThemeCss(theme);
                document.head.appendChild(ss);
            } else {
                link.attr('href', getThemeCss(theme));
            }
        } else {
            var themePrefix = 'theme_',
                key = themePrefix + theme;
            storage.get(key, function(items) {
                if(items[key]) {
                    $('#theme').remove();
                    var theme = $('#custom-theme');
                    if(!theme.length) {
                        var style = $('<style/>').attr('id', 'custom-theme')
                                        .html(items[key]);
                        $(document.head).append(style);
                    } else {
                        theme.html(items[key]);
                    }
                }
            });
        }
    }

    function setTheme() {
        let pageKey = specialThemePrefix + location.href
        storage.get([pageKey, 'theme', 'custom_themes', 'custom_css_paths'], function(items) {
            if (items.length == 0) {
                // load default theme
                insertThemeCss('Clearness')
            } else if (hasValue(items, pageKey)) {
                insertThemeCss(items[pageKey])
            } else if (hasValue(items, 'custom_css_paths')) {
                let cssPaths = JSON.parse(items.custom_css_paths)
                insertCssPaths(cssPaths)
            } else if (hasValue(items, 'theme')) {
                insertThemeCss(items.theme)
            }
        })
    }

    function stopAutoReload() {
        clearInterval(interval);
    }

    function startAutoReload() {
        stopAutoReload();

        var freq = defaultReloadFreq;
        storage.get('reload_freq', function(items) {
            if(items.reload_freq) {
                freq = items.reload_freq;
            }
        });

        interval = setInterval(function() {
            mpp.ajax({
                url: location,
                complete: (response) => {
                    let data;
                    
                    if (response && response.data) {
                        data = response.data;
                    } else {
                        // 如果无法获取数据，跳过这次重载
                        console.warn('Auto-reload failed, skipping this cycle');
                        return;
                    }
                    
                    if (previousText == data) {
                        return;
                    }
                    makeHtml(data);
                    previousText = data;
                }
            });
        }, freq * 1000);
    }

    function render() {
        if (!mpp.isText()) {
            return;
        }

        mpp.ajax({
            url: location,
            cache: false,
            complete: function(response) {
                let contentData;
                
                if (response && response.data) {
                    contentData = response.data;
                    if (response.fromFallback) {
                        console.log('Using fallback content from document.body');
                    }
                } else {
                    // 最后的备用方案
                    contentData = document.body.innerText;
                    console.log('Using final fallback: document.body.innerText');
                }
                
                previousText = contentData;
                makeHtml(contentData);
                setTheme()

                storage.get('auto_reload', function(items) {
                    if(items.auto_reload) {
                        startAutoReload();
                    }
                });
            }
        });
    }

    // 检查扩展状态
    showExtensionStatus();
    
    storage.get(['exclude_exts', 'disable_markdown', 'katex', 'html'], function(items) {
        if (items.disable_markdown) {
            return;
        }

        if (items.katex) {
            try {
                if (!chrome.runtime || !chrome.runtime.getURL) {
                    throw new Error('Extension context invalidated');
                }
                var mjc = document.createElement('link');
                mjc.rel = 'stylesheet';
                mjc.href = chrome.runtime.getURL('css/katex.min.css');
                $(document.head).append(mjc);
            } catch (error) {
                console.warn('Extension context error loading katex CSS:', error.message);
                // 可以继续工作，只是没有katex样式
            }
        }

        var allExtentions = ["md", "text", "markdown", "mdown", "txt", "mkd", "rst", "rmd"];
        var exts = items.exclude_exts;
        if(!exts) {
            render();
            return;
        }

        var fileExt = getExtension(location.href);
        if (($.inArray(fileExt, allExtentions) != -1) &&
            (typeof exts[fileExt] == "undefined")) {
            render();
        }
    });

    try {
        if (chrome.storage && chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
            chrome.storage.onChanged.addListener(function(changes, namespace) {
                var pageKey = specialThemePrefix + location.href;

                console.log("changes:", changes)
                for (key in changes) {
                    var value = changes[key];
                    if(key == pageKey || key == 'theme' || key == 'custom_css_paths') {
                        setTheme();
                    } else if(key == 'toc') {
                        location.reload();
                    } else if(key == 'reload_freq') {
                        storage.get('auto_reload', function(items) {
                            startAutoReload();
                        });
                    } else if(key == 'auto_reload') {
                        if(value.newValue) {
                            startAutoReload();
                        } else {
                            stopAutoReload();
                        }
                    } else if(key == 'disable_markdown') {
                        location.reload();
                    } else if(key == 'supportMath') {
                        location.reload();
                    } else if(key == 'katex') {
                        location.reload();
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Extension context error adding storage listener:', error.message);
        // 继续工作，只是没有动态设置监听
    }

}(document));
