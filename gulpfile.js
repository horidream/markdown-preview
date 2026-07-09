const gulp = require('gulp');
const rename = require('gulp-rename')
const esbuild = require('esbuild')

gulp.task('lib', function () {
  esbuild.buildSync({
    entryPoints: ['src/hori-markdown-entry.js'],
    bundle: true,
    format: 'iife',
    globalName: 'HoriMarkdownBundle',
    outfile: 'js/hori-markdown.bundle.js',
    platform: 'browser',
    target: ['chrome110'],
    loader: {
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file'
    },
    assetNames: '../css/fonts/[name]',
    logLevel: 'info'
  })

  gulp.src(['node_modules/marked-highlight/lib/index.cjs'])
    .pipe(rename('index.js'))
    .pipe(gulp.dest('js/marked-highlight'))

  gulp.src([
    'node_modules/katex/dist/katex.min.css'
  ]).pipe(gulp.dest('css'))

  gulp.src([
    'node_modules/katex/dist/fonts/*'
  ]).pipe(gulp.dest('css/fonts'))

  return gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/marked/marked.min.js',
    'node_modules/mermaid/dist/mermaid.min.js',
    'node_modules/katex/dist/katex.min.js'
  ]).pipe(gulp.dest('js'));
});
