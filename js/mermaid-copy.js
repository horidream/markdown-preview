/**
 * Mermaid diagram copy functionality
 * - Click: Copy PNG with transparent background
 * - Shift+Click: Copy JPEG with white background and padding
 */
var mermaidCopy = (function() {

    /**
     * Inline computed styles onto SVG elements to preserve them during export
     */
    function inlineComputedStyles(originalSvg, clonedSvg) {
        const styleProperties = [
            'rx', 'ry', 'stroke', 'stroke-width', 'fill', 'opacity',
            'stroke-opacity', 'fill-opacity', 'stroke-dasharray', 'stroke-linecap',
            'stroke-linejoin', 'font-family', 'font-size', 'font-weight'
        ];

        const originalElements = originalSvg.querySelectorAll('*');
        const clonedElements = clonedSvg.querySelectorAll('*');

        originalElements.forEach((origEl, index) => {
            const cloneEl = clonedElements[index];
            if (!cloneEl) return;

            const computedStyle = window.getComputedStyle(origEl);

            styleProperties.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);

                if (value && value !== 'none' && value !== 'auto' && value !== '') {
                    if ((prop === 'rx' || prop === 'ry') && cloneEl.tagName.toLowerCase() === 'rect') {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                            cloneEl.setAttribute(prop, numValue);
                        }
                    }
                }
            });
        });
    }

    /**
     * Export SVG to image and copy to clipboard
     * @param {SVGElement} svg - SVG element to export
     * @param {Object} options - Export options
     * @param {string} options.backgroundColor - Background color ('transparent' or color like '#ffffff')
     * @param {number} options.padding - Padding around the image
     * @returns {Promise<boolean>} Success status
     */
    async function exportSvgToImage(svg, options = {}) {
        try {
            const {
                backgroundColor = 'transparent',
                padding = (backgroundColor !== 'transparent' ? 40 : 0)
            } = options;

            // Clone the SVG to avoid modifying the original
            const svgClone = svg.cloneNode(true);

            // Inline computed styles
            inlineComputedStyles(svg, svgClone);

            // Get the SVG dimensions
            const bbox = svg.getBBox();
            const width = bbox.width || svg.width.baseVal.value || 800;
            const height = bbox.height || svg.height.baseVal.value || 600;

            // Set dimensions on the clone
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${width} ${height}`);

            // Remove problematic attributes
            svgClone.removeAttribute('xmlns:xlink');

            // Serialize the SVG
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

            // Create an image element
            const img = new Image();

            // Wait for the image to load
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgDataUrl;
            });

            // Create a canvas with padding
            const canvas = document.createElement('canvas');
            const scale = 2; // Higher resolution
            const canvasWidth = width + (padding * 2);
            const canvasHeight = height + (padding * 2);
            canvas.width = canvasWidth * scale;
            canvas.height = canvasHeight * scale;

            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);

            // Fill background if specified
            if (backgroundColor !== 'transparent') {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            } else {
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            }

            // Draw the image on the canvas with padding offset
            ctx.drawImage(img, padding, padding, width, height);

            // Always use PNG format (clipboard API doesn't support JPEG)
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, 'image/png');
            });

            // Copy to clipboard using the Clipboard API
            if (navigator.clipboard && window.ClipboardItem) {
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } else {
                console.warn('Clipboard API not supported');
                return false;
            }
        } catch (error) {
            console.error('Failed to export SVG to image:', error);
            return false;
        }
    }

    /**
     * Add copy button to a mermaid diagram container
     * @param {HTMLElement} container - The mermaid diagram container element
     */
    function addCopyButton(container) {
        // Check if button already exists
        if (container.querySelector('.mermaid-copy-button')) return;

        const svg = container.querySelector('svg');
        if (!svg) return;

        const copyButton = document.createElement('button');
        copyButton.className = 'mermaid-copy-button';
        copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="copy-text">Copy</span>
        `;
        copyButton.title = 'Click: Copy PNG (transparent)\nShift+Click: Copy PNG (white background)';

        // Position the container
        container.style.position = 'relative';
        container.appendChild(copyButton);

        // Add click handler
        copyButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            // Shift+Click for white background with padding
            const useWhiteBg = event.shiftKey;

            const success = await exportSvgToImage(svg, {
                backgroundColor: useWhiteBg ? '#ffffff' : 'transparent',
                padding: useWhiteBg ? 40 : 0
            });

            if (success) {
                copyButton.classList.add('copied');
                const textSpan = copyButton.querySelector('.copy-text');
                const originalText = textSpan.textContent;
                textSpan.textContent = 'Copied!';

                setTimeout(() => {
                    copyButton.classList.remove('copied');
                    textSpan.textContent = originalText;
                }, 2000);
            }
        });
    }

    /**
     * Initialize copy buttons for all mermaid diagrams
     * Should be called after mermaid diagrams are rendered
     */
    function initCopyButtons() {
        // Find all mermaid diagram containers
        const containers = document.querySelectorAll('[id^="mermaidId"]');
        containers.forEach(container => {
            // Wait a bit for SVG to be fully rendered
            setTimeout(() => addCopyButton(container), 100);
        });
    }

    // Expose functions
    return {
        addCopyButton: addCopyButton,
        initCopyButtons: initCopyButtons,
        exportSvgToImage: exportSvgToImage
    };

})();
