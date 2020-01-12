export function debounce(func: Function, wait: number) {
  let id: any;

  return function() {
    const args = arguments;
    const later = function() {
      id = null;
      func.apply(null, args);
    };

    clearTimeout(id);
    id = setTimeout(later, wait);
  };
}
