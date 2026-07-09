var diagramFlowSeq = {mermaidDivId: 0, mermaidInitialized: false};

(function (){

var codeStatus = "InCodeStatus";
var multiMathStatus = "InMultiMath";
var emptyStatus = "" ;

function initMermaid() {
    if (!diagramFlowSeq.mermaidInitialized && typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            themeVariables: {
                primaryColor: '#bbdefb',
                primaryTextColor: '#0d47a1',
                primaryBorderColor: '#1976d2',
                secondaryColor: '#ffe0b2',
                secondaryTextColor: '#e65100',
                secondaryBorderColor: '#ff9800',
                tertiaryColor: '#e1bee7',
                tertiaryTextColor: '#6a1b9a',
                tertiaryBorderColor: '#9c27b0',
                lineColor: '#546e7a',
                background: '#ffffff',
                nodeTextColor: '#212121',
                textColor: '#212121',
                labelTextColor: '#212121',
                edgeLabelBackground: '#ffffff',
                clusterBkg: '#eceff1',
                clusterBorder: '#78909c',
                defaultLinkColor: '#1565c0',
                titleColor: '#37474f',
                actorBorder: '#1976d2',
                actorBkg: '#e3f2fd',
                actorTextColor: '#0d47a1',
                actorLineColor: '#64b5f6',
                signalColor: '#546e7a',
                signalTextColor: '#212121',
                labelBoxBorderColor: '#78909c',
                labelBoxBkgColor: '#eceff1',
                loopTextColor: '#212121',
                noteBorderColor: '#ffc107',
                noteBkgColor: '#fff8e1',
                noteTextColor: '#212121',
                nodeBorder: '#78909c',
                pie1: '#42a5f5',
                pie2: '#66bb6a',
                pie3: '#ffa726',
                pie4: '#ab47bc',
                pie5: '#ef5350',
                pie6: '#26c6da',
                pie7: '#ffca28',
                pie8: '#8d6e63',
                pie9: '#78909c',
                pie10: '#ec407a',
                pie11: '#7e57c2',
                pie12: '#26a69a',
                cScale0: '#4A90D9',
                cScale1: '#5BB5A2',
                cScale2: '#E8915A',
                cScale3: '#9B7ED8',
                cScale4: '#E06B8A',
                cScale5: '#5AADCF',
                cScale6: '#D4A44C',
                cScale7: '#6BAF7D',
                cScale8: '#C47DB5',
                cScale9: '#7A9EB5',
                cScaleLabel0: '#ffffff',
                cScaleLabel1: '#ffffff',
                cScaleLabel2: '#ffffff',
                cScaleLabel3: '#ffffff',
                cScaleLabel4: '#ffffff',
                cScaleLabel5: '#ffffff',
                cScaleLabel6: '#ffffff',
                cScaleLabel7: '#ffffff',
                cScaleLabel8: '#ffffff',
                cScaleLabel9: '#ffffff',
                labelBackgroundColor: '#eceff1',
                git0: '#42a5f5',
                git1: '#66bb6a',
                git2: '#ffa726',
                git3: '#ab47bc',
                git4: '#ef5350',
                git5: '#26c6da',
                git6: '#ffca28',
                git7: '#78909c',
                classText: '#212121',
                taskBorderColor: '#1976d2',
                taskBkgColor: '#bbdefb',
                activeTaskBorderColor: '#388e3c',
                activeTaskBkgColor: '#c8e6c9',
                doneTaskBorderColor: '#78909c',
                doneTaskBkgColor: '#eceff1',
                critBorderColor: '#d32f2f',
                critBkgColor: '#ffcdd2',
                todayLineColor: '#f44336'
            },
            flowchart: {
                htmlLabels: true,
                curve: 'basis',
                rankSpacing: 50,
                nodeSpacing: 50,
                padding: 10
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true
            },
            mindmap: {
                padding: 10,
                maxNodeSizeX: 200,
                maxNodeSizeY: 100,
                useMaxWidth: true,
                nodeRadius: 10
            }
        });
        diagramFlowSeq.mermaidInitialized = true;
    }
}

function makeMermaidId(id) {
    return 'mermaidId' + id.toString();
}

function genNextMermaidDivId() {
    diagramFlowSeq.mermaidDivId += 1;
    return makeMermaidId(diagramFlowSeq.mermaidDivId);
}

function decodeHtmlEntities(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeMermaidSource(src) {
    return decodeHtmlEntities(src || '').replace(/\r\n?/g, '\n').trim();
}

function removeInlineSvgMaxWidth(container) {
    var svgs = container.querySelectorAll('svg');
    svgs.forEach(function(svg) {
        svg.style.removeProperty('max-width');
        if (!svg.getAttribute('style')) {
            svg.removeAttribute('style');
        }
    });
}

async function renderMermaidWithRun(divMermaid, id, txt) {
    var graphDiv = document.createElement('div');
    graphDiv.id = 'mermaidGraph-' + id;
    graphDiv.className = 'mermaid';
    graphDiv.textContent = txt;

    divMermaid.dataset.mermaidSource = txt;
    divMermaid.innerHTML = '';
    divMermaid.appendChild(graphDiv);

    await mermaid.run({
        nodes: [graphDiv],
        suppressErrors: false
    });

    removeInlineSvgMaxWidth(divMermaid);
}

async function drawMermaid(id) {
    initMermaid();
    var divMermaid = document.getElementById(id);
    if (!divMermaid) return;

    var txt = normalizeMermaidSource(divMermaid.textContent || divMermaid.innerHTML);
    if (!txt || !txt.trim()) return;

    try {
        divMermaid.classList.remove('mermaid-rendered', 'mermaid-error');
        divMermaid.classList.add('mermaid-loading');
        await renderMermaidWithRun(divMermaid, id, txt);
        divMermaid.classList.remove('mermaid-loading');
        divMermaid.classList.add('mermaid-rendered');
    } catch (e) {
        console.error('Mermaid render error:', e);
        divMermaid.classList.remove('mermaid-loading', 'mermaid-rendered');
        divMermaid.classList.add('mermaid-error');
        divMermaid.innerHTML = '<pre style="color: red;">Mermaid Error: ' + e.message + '</pre><pre>' + txt + '</pre>';
    }
}

function resetDivId() {
    diagramFlowSeq.mermaidDivId = 0;
}

async function drawAllMermaid() {
    for (var i = 1; i <= diagramFlowSeq.mermaidDivId; ++i) {
        var mermaidId = makeMermaidId(i);
        await drawMermaid(mermaidId);
    }
    // Initialize copy buttons after all diagrams are rendered
    if (typeof mermaidCopy !== 'undefined') {
        mermaidCopy.initCopyButtons();
    }
}

function renderKatex(srcMath, isDisplay) {
    const unEscape = function (html) {
        return html
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/\\$/g, '');
    };
    let repMath = "";
    srcMath = unEscape(srcMath);
    try {
        repMath = katex.renderToString(srcMath, {displayMode: isDisplay});
        repMath = repMath.replace(/~/g, '\\~')
    } catch(err) {
        console.error("katex parse math string[" + srcMath + "] failed! throw error: " + err);
        repMath = "";
    }
    return repMath;
}

function replaceMathString(src) {
    // patch: Troy Daniel
    // A regex expression to exclude the code tag with the help of look-around operation is not preferred, due to:
    // This is a <code>$x$</code> to produce $x$, and a <code>$y$</code> to produce $y$,
    // If we apply the look-around, the first capture will be '$</code> to produce $', which is not correct
    // Therefore, a simple way, split the src at 'code block',
    // Known bugs:
    // \`$abcd$\` and \<code>$abcd$\</code>  won't render, actually, I don't hnow what's the espected result.
    var reCode = /(`|<code[^>]*>)\s*(\\.|.)*?(`|<\/code>)/g;
    var codes = [...src.matchAll(reCode)];
    var parts = [];
    var startIndex = 0;
    for(const g of codes){
        parts.push(renderInlineMath(src.substring(startIndex, g.index)));
        parts.push(src.substr(g.index, g[0].length));
        startIndex = g.index + g[0].length;
    }
    parts.push(renderInlineMath(src.substring(startIndex)));
    return parts.join("");

    function renderInlineMath(plainStr){
        var out = plainStr;
        var pattern = /(\$`)((?:\\.|[\s\S])+?)(`\$)|(\${1,2})((?:\\.|[\s\S])+?)\4|(\\\[)((?:\\.|[\s\S])+?)(\\])|(\\\()((?:\\.|[\s\S])+?)(\\\))/g;
        var mc = null;
        while (null != (mc = pattern.exec(plainStr))) {
            var srcMath = "";
            var isDisplay = false;
            if (mc[1]) { //match $` `$
                isDisplay = false;
                srcMath = mc[2];
            } else if (mc[4]) { //match $ or $$
                srcMath = mc[5];
                isDisplay = (mc[4] === '$$');
            } else if (mc[6]) { //match \\[ \\]
                isDisplay = true;
                srcMath = mc[7];
            } else if (mc[9]) { //match \\( \\)
                isDisplay = false;
                srcMath = mc[10];
            }

            var repMath = renderKatex(srcMath, isDisplay);
            if (repMath && repMath.length !== 0) {
                out = out.replace(mc[0], repMath);
            }
        }
        return out.replace(/\\<span/g, '<span');
    }
}

function prepareSpecialCode(lang, code) {
    var retStr = "";
    if (lang === "math") {
        retStr = renderKatex(code, true);
    } else if (lang === "mermaid") {
        var mermiadId = genNextMermaidDivId();
        retStr = '<div id=\"' + mermiadId + '\">' + escapeHtml(code) + '</div>\n';
    } else if (lang === "puml") {
        if (window.navigator.onLine) {
            const umlCode = platumlEncoder.platumlCompress(code);
            retStr = '<img src=\"' + umlCode + '\">\n';
        } else {
            retStr = '<code>' + code + '</code>\n';
        }
    }
    return retStr;
}

function isStartMultiMath(src) {
    var pattern = /^(\s*)(\${2})|^(\s*)(\\\[)/g;
    var npt = /(\${2})((?:\\.|[\s\S])+?)\1|(\\\[)((?:\\.|[\s\S])+?)(\\])/g;
    var mc = null;
    var ret = false;
    if (null != (mc = pattern.exec(src)) && null == npt.exec(src)) {
        ret = true;
    }
    return ret;
}

function isEndMultiMath(src) {
    var pattern = /(\${2})(\s*)$|(\\])(\s*)$/g;
    var mc = null;
    var ret = false;
    if (null != (mc = pattern.exec(src))) {
        ret = true;
    }
    return ret;
}

function prepareDiagram(data) {
    var lines = data.split('\n');
    var retStr = "";
    var curStatus = "";
    var preLangs = ["math", "mermaid", "puml"];
    var lang = "";
    var tmpCode = "";
    var isInCode = function () { 
        return curStatus === codeStatus; 
    }
    var isInMultiMath = function () {
        return curStatus === multiMathStatus; 
    }
    var setCurStatus = function(status) {
        curStatus = status;
    }
    var isPrepareLang = function() {
        return preLangs.indexOf(lang) !== -1;
    }
    var isStartCode = function(src) {
        var pattern = /^(\s*)(`{3,})(\w*)/g;
        var mc = null;
        var ret = false;
        if (null != (mc = pattern.exec(src))) {
            lang = mc[3];
            ret = true;
        }
        return ret;
    }
    var isEndCode = function(src) {
        var pattern = /^(\s*)(`{3,})(\w*)/g;
        var mc = null;
        var ret = false;
        if (null != (mc = pattern.exec(src))) {
            ret = true;
        }
        return ret;
    }

    resetDivId();
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (isInCode() && isEndCode(line)) {
            var specialCode = prepareSpecialCode(lang, tmpCode);
            if (specialCode.length > 0) {
                retStr += specialCode;
            } else {
                retStr += line + "\n";
            }
            line = "\n";
            setCurStatus(emptyStatus);
        }
        if (isInMultiMath() && isEndMultiMath(line)) {
            tmpCode += line;
            retStr += replaceMathString(tmpCode.replace("\n", "\t")) + "\n";
            line = "\n";
            setCurStatus(emptyStatus);
        }

        if (!isInCode() && isStartCode(line)) {
            setCurStatus(codeStatus);
            if (isPrepareLang()) {
                tmpCode = "";
                line = "\n";
            }
        }
        if (!isInMultiMath() && isStartMultiMath(line)) {
            setCurStatus(multiMathStatus);
            tmpCode = line;
            lang = "";
            line = "\n";
        }

        if (!isInCode() && !isInMultiMath()) {
            var mathSrc = replaceMathString(line);
            retStr += (mathSrc + '\n');
        } else {
            if (isPrepareLang() || isInMultiMath()) {
                line = line.replace(/(\n[\s\t]*\r*\n)/g, '\n').replace(/^[\n\r\n\t]*|[\n\r\n\t]*$/g, '');
                if (line.length > 0) {
                    tmpCode += (line + '\n');
                }
            } else {
                retStr += (line + '\n');
            }
        }
    }
    return retStr;
}

//Expose
diagramFlowSeq.drawAllMermaid = drawAllMermaid;
diagramFlowSeq.prepareDiagram = prepareDiagram;

})();
