import gulp from 'gulp'
import sass from 'gulp-sass'
import babel from 'gulp-babel'
import React from 'react'
import ReactDOM from 'react-dom'
import requirejs from 'requirejs'
import webserver from 'gulp-webserver'
import sourcemaps from 'gulp-sourcemaps'
import requireFresh from './require-fresh.js'

const WEB_DIR = 'web'
const BUILD_DIR = 'build'
const PAGES_DIR = `${WEB_DIR}/pages`
const ENGINE_DIR = 'engine'
const BUILD_JS_DIR = `${BUILD_DIR}/js`
const STYLESHEET_DIR = `${WEB_DIR}/stylesheets`

gulp.task('default', ['watch'])

gulp.task('watch', ['dev-server'], () => {
  gulp.watch([
    `${STYLESHEET_DIR}/**/*.scss`,
    `${WEB_DIR}/**/*.{js,jsx}`,
    `${ENGINE_DIR}/**/*.{js,jsx}`,
  ], ['dev-render-pages'])
})

gulp.task('dev-server', ['dev-render-pages'], () => {
  return gulp.src(BUILD_DIR)
    .pipe(webserver({
      port: 5858,
      open: true,
    }))
})

gulp.task('dev-compile-scss', () => {
  return gulp.src(`${STYLESHEET_DIR}/app.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(BUILD_DIR))
})

gulp.task('dev-compile-jsx', () => {
  const normalizeAMDModules =
    requireFresh('./engine/gulp-normalize-amd-modules.js').default

  return gulp.src(`${WEB_DIR}/**/*.{js,jsx}`)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015'],
      plugins: [
        ['transform-react-jsx', {}],
        ['transform-object-rest-spread', {}],
        ['transform-es2015-modules-amd', {}],
      ],
    }))
    .pipe(normalizeAMDModules())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(BUILD_JS_DIR))
})

gulp.task('dev-render-pages', ['dev-compile-jsx', 'dev-compile-scss'], () => {
  const renderPipeline =
    requireFresh('./engine/gulp-render-pipeline.js').default

  return gulp.src(`${PAGES_DIR}/**/*.jsx`)
    .pipe(renderPipeline({
      baseDir: PAGES_DIR,
      buildDir: BUILD_DIR,
      cdnPaths: {
        /* eslint-disable max-len */
        'react': `https://npmcdn.com/react@${React.version}/dist/react.js`,
        'react-dom': `https://npmcdn.com/react-dom@${ReactDOM.version}/dist/react-dom.js`,
        'requirejs': `https://cdnjs.cloudflare.com/ajax/libs/require.js/${requirejs.version}/require.js`,
        /* eslint-enable max-len */
      },
      globalStylesheet: 'app.css',
    }).on('error', console.error))
    .pipe(gulp.dest(BUILD_DIR))
})
