import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from './model'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;

  // 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      keymap(baseKeymap),
      // 接入 history 插件，提供输入历史栈功能
      history(),
      // 将组合按键 ctrl/cmd + z, ctrl/cmd + y 分别绑定到 undo, redo 功能上
      keymap({"Mod-z": undo, "Mod-y": redo}),
    ]
  })
  
  // 创建编辑器视图实例，并挂在到 el 上
  const editorView = new EditorView(el, {
    state: editorState
  })

  window.editorView = editorView

  console.log('editorView', editorView)
}