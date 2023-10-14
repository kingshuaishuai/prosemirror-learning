import crel from 'crelt';
import { EditorView } from "prosemirror-view";
import { MenuItem, MenuItemSpec } from "./menu-item";
import { EditorState } from 'prosemirror-state';

export interface MenuGroupSpec {
  name?: string;
  class?: string;
  menus: MenuItemSpec[];
}

export class MenuGroup {
  constructor(private view: EditorView, private spec: MenuGroupSpec) {
    const dom = crel('div', { class: this.spec.class })
    dom.classList.add('menu-group')

    this.dom = dom;
    this.menus = spec.menus.map((menuSpec) => new MenuItem(this.view, menuSpec))

    this.menus.forEach(menu => {
      dom.appendChild(menu.dom)
    })
  }

  private menus: MenuItem[]
  
  dom: HTMLElement;

  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.menus.forEach(menu => {
      menu.update(view, state)
    })
  }
}