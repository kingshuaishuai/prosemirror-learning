import crel from 'crelt';
import { EditorView } from "prosemirror-view";
import { MenuGroup, MenuGroupSpec } from "./menu";
import { EditorState, PluginView } from 'prosemirror-state';

export interface ToolbarSpec {
  groups: MenuGroupSpec[]
  class?: string
}

export class Toolbar implements PluginView {
  constructor(private view: EditorView, private spec: ToolbarSpec) {
    const toolbarDom = crel('div', { spec: this.spec.class })
    toolbarDom.classList.add('toolbar');

    this.dom = toolbarDom;

    this.groups = this.spec.groups.map(groupSpec => new MenuGroup(this.view, groupSpec))
    
    this.groups.forEach(group => {
      this.dom.appendChild(group.dom)
    })

    this.render();
  }

  render() {
    if (this.view.dom.parentNode) {
      const parentNode = this.view.dom.parentNode;
      const editorViewDom = parentNode.replaceChild(this.dom, this.view.dom);
      parentNode.appendChild(editorViewDom)
    }
  }

  groups: MenuGroup[]

  dom: HTMLElement;
  update(view: EditorView, state: EditorState) {
    if (!this.dom.parentNode) {
      this.render()
    }
    this.view = view;
    this.groups.forEach(group => {
      group.update(this.view, state);
    })
  }

  destroy() {
    this.dom.remove()
  }
}