import { EditorView } from 'prosemirror-view'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { schema } from '../schema-learning/schema'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'
import { insertBlockquote, insertDatetime, insertHeading, insertParagraph, insertParagraphCommand } from '../utils/insertContent'
import { Toolbar } from '../ui/toolbar'
import { canSetMark, isMarkActive, toggleBoldCmd, toggleMark } from '../utils/setMark-learn'
import { createVirtualCursor } from 'prosemirror-virtual-cursor'
import 'prosemirror-virtual-cursor/style/virtual-cursor.css'
import { gapCursor } from 'prosemirror-gapcursor'
import 'prosemirror-gapcursor/style/gapcursor.css'
import { docChangedTimesPlugin } from '../plugins/doc-changed-times'
// import { isAllowBold, isAllowItalic, isBold, isItalic, toggleBold, toggleItalic } from '../utils/setMark'

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;
  
  const editorRoot = document.createElement('div');
  editorRoot.id = 'editorRoot';

  // 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      keymap({
        ...baseKeymap,
        Enter: insertParagraphCommand
      }),
      // 接入 history 插件，提供输入历史栈功能
      history(),
      // 将组合按键 ctrl/cmd + z, ctrl/cmd + y 分别绑定到 undo, redo 功能上
      keymap({
        "Mod-z": undo,
        "Mod-Shift-z": redo,
        "Mod-b": toggleBoldCmd
      }),
      new Plugin({
        key: new PluginKey('toolbar'),
        view: (view) => new Toolbar(view, {
          groups: [
            {
              name: '段落',
              menus: [
                {
                  label: '添加段落',
                  handler: (props) => {
                    const { view } = props;
                    insertParagraph(view, '新段落')
                  },
                },
                {
                  label: '添加一级标题',
                  handler: (props) => {
                    insertHeading(props.view, '新一级标题')
                  },
                },
                {
                  label: '添加 blockquote',
                  handler: (props) => {
                    insertBlockquote(props.view)
                  },
                },
                {
                  label: '添加 datetime',
                  handler: (props) => {
                    insertDatetime(props.view, Date.now())
                  },
                }
              ]
            },
            {
              name: '格式',
              menus: [
                {
                  label: 'B',
                  handler(props) {
                    handleSetMark(props.view, 'bold')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'bold', menuDom)
                  }
                },
                {
                  label: 'I',
                  handler(props) {
                    handleSetMark(props.view, 'italic')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'italic', menuDom)
                  }
                },
                {
                  label: 'S',
                  handler(props) {
                    handleSetMark(props.view, 'strike')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'strike', menuDom)
                  }
                },
                {
                  label: 'U',
                  handler(props) {
                    handleSetMark(props.view, 'underline')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'underline', menuDom)
                  }
                },
                {
                  label: 'X<sup>2</sup>',
                  handler(props) {
                    handleSetMark(props.view, 'sup')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'sup', menuDom)
                  }
                },
                {
                  label: 'X<sub>2</sub>',
                  handler(props) {
                    handleSetMark(props.view, 'sub')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'sub', menuDom)
                  }
                },
                {
                  label: 'C',
                  handler(props) {
                    handleSetMark(props.view, 'code')
                  },
                  update(view, _, menuDom) {
                    handleUpdateMenu(view, 'code', menuDom)
                  }
                }
              ]
            }
          ]
        })
      }),
      docChangedTimesPlugin(),
    ]
  })
  
  // 创建编辑器视图实例，并挂在到 el 上
  const editorView = new EditorView(editorRoot, {
    state: editorState,
    // dispatchTransaction(tr) {
    //   let newState = editorView.state.apply(tr);
    //   editorView.updateState(newState);
    //   toolbar.update(editorView, editorView.state)
    // }
  })

  function handleSetMark(view: EditorView, type: string) {
    toggleMark(view, type)
    view.focus();
  }

  function handleUpdateMenu(view: EditorView, type: string, menuDom: HTMLElement) {
    const disabled = !canSetMark(view, type)
    if (disabled && !menuDom.getAttribute('disabled')) {
      menuDom.setAttribute('disabled', 'true')
      return;
    }
    if (!disabled && menuDom.getAttribute('disabled')) {
      menuDom.removeAttribute('disabled')
    }
    const isActive = isMarkActive(view, type)
    if (isActive && !menuDom.classList.contains('is-active')) {
      menuDom.classList.add('is-active')
    }

    if (!isActive && menuDom.classList.contains('is-active')) {
      menuDom.classList.remove('is-active')
    }
  }
  
  el.appendChild(editorRoot)

  // @ts-ignore
  window.editorView = editorView
}