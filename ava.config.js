
export default {
  files: [
    '*.spec.js'
  ],
  require: [
    '@babel/register'
  ],
  babel: {
    testOptions: {
      presets: [
        '@babel/preset-env'
      ]
    }
  }
}
