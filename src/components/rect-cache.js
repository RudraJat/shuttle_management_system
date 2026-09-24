export function createRectCache(element) {
  let rect = element.getBoundingClientRect();
  const update = () => {
    rect = element.getBoundingClientRect();
  };
  window.addEventListener('scroll', update, { passive: true, capture: true });
  window.addEventListener('resize', update, { passive: true });
  return {
    get current() {
      return rect;
    },
    update,
    destroy() {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    },
  };
}
