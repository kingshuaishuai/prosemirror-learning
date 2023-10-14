import crel from 'crelt'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
// 抽象 menu 的定义，不要每次都定义很多 html
/**
 * const btn = document.createElement('button')
 * btn.classList.add('is-active') // 当前 btn 激活
 * btn.classList.add('is-disabled') // 当前 btn 禁用
 * btn.onClick = fn // 点击 btn 后的效果
 * 
 * update btn style
 */

export interface MenuItemSpec {
  class?: string;
  label: string;
  handler: (
    props: {
      view: EditorView;
      state: EditorState;
      tr: Transaction;
      dispatch: EditorView['dispatch'];
    }, 
    event: MouseEvent
  ) => void;
  update?: (view: EditorView, state: EditorState, menu: HTMLElement) => void;
}

export class MenuItem {
  constructor(private view: EditorView, private spec: MenuItemSpec) {
    const _this = this;
    const btn = crel('button', { 
      class: spec.class, 
      onclick(this, event: MouseEvent) {
        spec.handler({
          view: _this.view,
          state: _this.view.state,
          dispatch: _this.view.dispatch,
          tr: _this.view.state.tr
        }, event)
      }
    })

    btn.classList.add('menu-item')

    btn.innerText = spec.label;

    this.dom = btn;
  }

  dom: HTMLElement;
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.spec.update?.(view, state, this.dom)
  }
}