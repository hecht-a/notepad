export function removeChildren(parent) {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
}