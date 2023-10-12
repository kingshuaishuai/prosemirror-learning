import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from '../schema-learning/schema'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'
import { insertBlockquote, insertDatetime, insertHeading, insertParagraph } from '../utils/insertContent'

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;
  
  const editorRoot = document.createElement('div');
  editorRoot.id = 'editorRoot';

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
  const editorView = new EditorView(editorRoot, {
    state: editorState
  })

  const btnGroup = document.createElement('div');
  btnGroup.style.marginBottom = '12px';
  const addParagraphBtn = document.createElement('button');
  addParagraphBtn.innerText = '添加新段落';
  addParagraphBtn.addEventListener('click', () => insertParagraph(editorView, '新段落'))

  const addHeadingBtn = document.createElement('button');
  addHeadingBtn.innerText = '添加新一级标题';
  addHeadingBtn.addEventListener('click', () => insertHeading(editorView, '新一级标题'))

  const addBlockquoteBtn = document.createElement('button');
  addBlockquoteBtn.innerText = '添加 blockquote';
  addBlockquoteBtn.addEventListener('click', () => insertBlockquote(editorView, 'new blockquote'))

  const addDatetimeBtn = document.createElement('button');
  addDatetimeBtn.innerText = '添加 datetime';
  addDatetimeBtn.addEventListener('click', () => insertDatetime(editorView))

  btnGroup.appendChild(addHeadingBtn)
  btnGroup.appendChild(addParagraphBtn)
  btnGroup.appendChild(addBlockquoteBtn)
  btnGroup.appendChild(addDatetimeBtn)

  const fragment = document.createDocumentFragment()
  fragment.appendChild(btnGroup)
  fragment.appendChild(editorRoot)

  el.appendChild(fragment)
  

  // @ts-ignore
  window.editorView = editorView
}