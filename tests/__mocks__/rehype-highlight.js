// Mock rehype-highlight plugin
module.exports = function rehypeHighlight() {
  return function transformer(tree) {
    return tree;
  };
};