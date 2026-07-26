import {
  enhanceTables,
  highlightCodeBlocks,
  parseMarkdown,
  parseMarkdownDetails,
  processMathExpressions
} from '@hori/markdown'
import {
  attachVisualPreviews,
  renderSvgBlocks
} from '@hori/markdown/visuals'
import '@hori/markdown/styles.css'
import '@hori/markdown/visuals.css'

window.horiMarkdown = {
  attachVisualPreviews,
  enhanceTables,
  highlightCodeBlocks,
  parseMarkdown,
  parseMarkdownDetails,
  processMathExpressions,
  renderSvgBlocks
}
