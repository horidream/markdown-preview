/**
 * Mermaid diagram copy functionality.
 * - Click: copy transparent PNG
 * - Shift+Click: copy white-background PNG
 * - Cmd/Ctrl+Click: copy Mermaid source
 * - Option/Alt with any mode: download instead of copy
 */
var mermaidCopy = (function() {
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            var textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                return true;
            } finally {
                textArea.remove();
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    function downloadBlob(blob, filename) {
        try {
            var downloadUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            return true;
        } catch (error) {
            console.error('Failed to download blob:', error);
            return false;
        }
    }

    function downloadTextFile(text, filename, type) {
        return downloadBlob(new Blob([text], { type: type || 'text/plain' }), filename);
    }

    function shrinkFontsForExport(svgClone, factor) {
        factor = factor || 0.90;

        var styleEl = svgClone.querySelector('style');
        if (styleEl && styleEl.textContent) {
            styleEl.textContent = styleEl.textContent.replace(
                /font-size\s*:\s*([\d.]+)px/g,
                function(match, size) {
                    return 'font-size:' + (parseFloat(size) * factor).toFixed(1) + 'px';
                }
            );
        }

        var allEls = svgClone.querySelectorAll('[style*="font-size"], [font-size]');
        allEls.forEach(function(el) {
            var inlineSize = el.style.fontSize;
            if (inlineSize) {
                var inlinePx = parseFloat(inlineSize);
                if (!isNaN(inlinePx)) {
                    el.style.fontSize = (inlinePx * factor).toFixed(1) + 'px';
                }
            }

            var attrSize = el.getAttribute('font-size');
            if (attrSize) {
                var attrPx = parseFloat(attrSize);
                if (!isNaN(attrPx)) {
                    el.setAttribute('font-size', (attrPx * factor).toFixed(1) + 'px');
                }
            }
        });
    }

    function inlineComputedStyles(originalSvg, clonedSvg) {
        var styleProperties = [
            'rx', 'ry', 'stroke', 'stroke-width', 'fill', 'opacity',
            'stroke-opacity', 'fill-opacity', 'stroke-dasharray', 'stroke-linecap',
            'stroke-linejoin', 'font-family', 'font-size', 'font-weight'
        ];

        var originalElements = originalSvg.querySelectorAll('*');
        var clonedElements = clonedSvg.querySelectorAll('*');

        originalElements.forEach(function(origEl, index) {
            var cloneEl = clonedElements[index];
            if (!cloneEl) return;

            var computedStyle = window.getComputedStyle(origEl);

            styleProperties.forEach(function(prop) {
                var value = computedStyle.getPropertyValue(prop);

                if (value && value !== 'none' && value !== 'auto' && value !== '') {
                    if ((prop === 'rx' || prop === 'ry') && cloneEl.tagName.toLowerCase() === 'rect') {
                        var numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                            cloneEl.setAttribute(prop, numValue);
                        }
                    }
                }
            });
        });
    }

    async function exportSvgToImage(svg, options) {
        options = options || {};

        try {
            var asJpeg = options.asJpeg || false;
            var backgroundColor = options.backgroundColor || (asJpeg ? '#ffffff' : 'transparent');
            var padding = options.padding !== undefined ? options.padding : (backgroundColor !== 'transparent' ? 40 : 0);
            var download = options.download || false;
            var filenamePrefix = options.filenamePrefix || 'diagram';

            var svgClone = svg.cloneNode(true);
            inlineComputedStyles(svg, svgClone);
            shrinkFontsForExport(svgClone);

            var bbox = svg.getBBox();
            var width = bbox.width || svg.width.baseVal.value || 800;
            var height = bbox.height || svg.height.baseVal.value || 600;

            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', bbox.x + ' ' + bbox.y + ' ' + width + ' ' + height);
            svgClone.removeAttribute('xmlns:xlink');

            var svgData = new XMLSerializer().serializeToString(svgClone);
            var svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

            var img = new Image();
            await new Promise(function(resolve, reject) {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgDataUrl;
            });

            var canvas = document.createElement('canvas');
            var scale = 2;
            var canvasWidth = width + (padding * 2);
            var canvasHeight = height + (padding * 2);
            canvas.width = canvasWidth * scale;
            canvas.height = canvasHeight * scale;

            var ctx = canvas.getContext('2d', { willReadFrequently: false });
            ctx.scale(scale, scale);

            if (backgroundColor !== 'transparent') {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            } else {
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            }

            ctx.drawImage(img, padding, padding, width, height);

            var format = asJpeg ? 'image/jpeg' : 'image/png';
            var quality = asJpeg ? 0.95 : undefined;
            var extension = asJpeg ? 'jpg' : 'png';

            var blob = await new Promise(function(resolve, reject) {
                canvas.toBlob(function(b) {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, format, quality);
            });

            if (download) {
                return downloadBlob(blob, filenamePrefix + '-' + Date.now() + '.' + extension);
            }

            if (navigator.clipboard && window.ClipboardItem) {
                var clipboardItem = new ClipboardItem({ [format]: blob });
                await navigator.clipboard.write([clipboardItem]);
                return true;
            }

            console.warn('Clipboard API not supported, downloading image instead');
            return downloadBlob(blob, filenamePrefix + '-' + Date.now() + '.' + extension);
        } catch (error) {
            console.error('Failed to export SVG to image:', error);
            return false;
        }
    }

    function exportSvgToPng(svg) {
        return exportSvgToImage(svg, { asJpeg: false });
    }

    function downloadSvgToPng(svg, filenamePrefix) {
        return exportSvgToImage(svg, {
            asJpeg: false,
            download: true,
            filenamePrefix: filenamePrefix || 'diagram'
        });
    }

    async function handleDiagramCopyAction(event, options) {
        var wantsDownload = event.altKey;
        var wantsSource = event.metaKey || event.ctrlKey;
        var wantsWhiteBackground = event.shiftKey;

        if (wantsSource) {
            return wantsDownload
                ? options.downloadSource()
                : await copyToClipboard(options.source);
        }

        if (wantsWhiteBackground) {
            return await exportSvgToImage(options.svg, {
                asJpeg: false,
                backgroundColor: '#ffffff',
                download: wantsDownload,
                filenamePrefix: options.imageFilenamePrefix + '-white'
            });
        }

        return wantsDownload
            ? await downloadSvgToPng(options.svg, options.imageFilenamePrefix)
            : await exportSvgToPng(options.svg);
    }

    function getDiagramCopyFeedback(event, sourceType) {
        if (event.altKey) return 'Saved';
        if (event.metaKey || event.ctrlKey) return 'Copied ' + sourceType;
        return 'Copied PNG';
    }

    function addCopyButton(container) {
        if (container.querySelector('.mermaid-copy-button')) return;

        var svg = container.querySelector('svg');
        if (!svg) return;

        var source = container.dataset.mermaidSource || '';
        var copyButton = document.createElement('button');
        copyButton.className = 'mermaid-copy-button';
        copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="copy-text">Copy</span>
        `;
        copyButton.title = 'Click copy transparent PNG; Shift copy white PNG; Cmd/Ctrl copy Mermaid source; add Option/Alt to download';

        container.style.position = 'relative';
        container.appendChild(copyButton);

        copyButton.addEventListener('click', async function(event) {
            event.preventDefault();
            event.stopPropagation();

            var success = await handleDiagramCopyAction(event, {
                svg: svg,
                source: source,
                downloadSource: function() {
                    return downloadTextFile(source, container.id + '-' + Date.now() + '.mmd', 'text/plain');
                },
                imageFilenamePrefix: 'mermaid-diagram'
            });

            if (success) {
                copyButton.classList.add('copied');
                var textSpan = copyButton.querySelector('.copy-text');
                var originalText = textSpan.textContent;
                textSpan.textContent = getDiagramCopyFeedback(event, 'code');

                setTimeout(function() {
                    copyButton.classList.remove('copied');
                    textSpan.textContent = originalText;
                }, 2000);
            }
        });
    }

    function initCopyButtons() {
        var containers = document.querySelectorAll('[id^="mermaidId"].mermaid-rendered');
        containers.forEach(function(container) {
            setTimeout(function() {
                addCopyButton(container);
            }, 100);
        });
    }

    return {
        addCopyButton: addCopyButton,
        initCopyButtons: initCopyButtons,
        exportSvgToImage: exportSvgToImage,
        copyToClipboard: copyToClipboard,
        downloadTextFile: downloadTextFile
    };
})();
