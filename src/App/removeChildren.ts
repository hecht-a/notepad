export function removeChildren(parent: HTMLElement) {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
}
