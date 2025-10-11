module.exports = function (api) {
  api.cache(true);
  return {
    // `nativewind/babel` exports a config object (with `plugins`),
    // so it must be used as a preset rather than a plugin. Placing
    // it in `plugins` causes Babel to see an object with `plugins`
    // where a plugin function is expected and throws the
    // ".plugins is not a valid Plugin property" error.
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  };
};
