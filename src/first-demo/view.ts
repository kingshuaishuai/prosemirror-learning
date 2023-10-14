import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from '../schema-learning/schema'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'
import { insertBlockquote, insertDatetime, insertHeading, insertParagraph } from '../utils/insertContent'
import { Toolbar } from '../ui/toolbar'
import { isAllowBold, isAllowItalic, isBold, isItalic, setBold, toggleBold, toggleItalic, unsetBold } from '../utils/setMark'

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
    state: editorState,
    dispatchTransaction(tr) {
      let newState = editorView.state.apply(tr);
      editorView.updateState(newState);
      toolbar.update(editorView, editorView.state)
    }
  })

  const toolbar = new Toolbar(editorView, {
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
          // {
          //   label: '加粗',
          //   handler(props) {
          //     setBold(props.view)
          //   }
          // },
          // {
          //   label: '取消加粗',
          //   handler(props) {
          //     unsetBold(props.view)
          //   }
          // }
          {
            label: 'B',
            handler(props) {
              toggleBold(props.view)
            },
            update(view, state, menu) {
              const disabled = !isAllowBold(view);
              if (disabled && !menu.getAttribute('disabled')) {
                menu.setAttribute('disabled', 'true')
              }

              if (!disabled && menu.getAttribute('disabled')) {
                menu.removeAttribute('disabled')
              }

              const isActive = isBold(view);
              if (isActive && !menu.classList.contains('is-active')) {
                menu.classList.add('is-active')
              }

              if (!isActive && menu.classList.contains('is-active')) {
                menu.classList.remove('is-active')
              }

              view.focus();
            }
          },
          {
            label: 'I',
            handler(props) {
              toggleItalic(props.view)
            },
            update(view, state, menu) {
              const disabled = !isAllowItalic(view);
              if (disabled && !menu.getAttribute('disabled')) {
                menu.setAttribute('disabled', 'true')
              }

              if (!disabled && menu.getAttribute('disabled')) {
                menu.removeAttribute('disabled')
              }

              const isActive = isItalic(view);
              if (isActive && !menu.classList.contains('is-active')) {
                menu.classList.add('is-active')
              }

              if (!isActive && menu.classList.contains('is-active')) {
                menu.classList.remove('is-active')
              }

              view.focus();
            }
          }
        ]
      }
    ]
  })
  
  el.appendChild(editorRoot)

  // @ts-ignore
  window.editorView = editorView
}