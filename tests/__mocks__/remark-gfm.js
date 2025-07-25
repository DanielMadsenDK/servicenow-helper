// Mock remark-gfm plugin
module.exports = function remarkGfm() {
  return function transformer(tree) {
    return tree;
  };
};