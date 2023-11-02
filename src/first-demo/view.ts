import { EditorView } from 'prosemirror-view'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { createTable, schema } from '../schema-learning/schema'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, chainCommands } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'
import { insertBlockquote, insertDatetime, insertHeading, insertParagraph, insertParagraphCommand } from '../utils/insertContent'
import { Toolbar } from '../ui/toolbar'
import { canSetMark, isMarkActive, toggleBoldCmd, toggleMark } from '../utils/setMark-learn'
import 'prosemirror-virtual-cursor/style/virtual-cursor.css'
import 'prosemirror-gapcursor/style/gapcursor.css'
import { docChangedTimesPlugin } from '../plugins/doc-changed-times'
import 'prosemirror-view/style/prosemirror.css'
import { codeBlockViewConstructor, createCodeBlockCmd } from '../schema-learning/codeblock'
import '../schema-learning/codeblock.css'
import "highlight.js/styles/atom-one-dark-reasonable.css";
import { highlightCodePlugin, selectAllCodeCmd } from '../plugins/code-highlight/core';
import { Fragment } from 'prosemirror-model';
import "prosemirror-tables/style/tables.css";
import { tableEditing, columnResizing, CellSelection, selectedRect } from 'prosemirror-tables'

const fg = Fragment.fromJSON(schema, [{
  type: 'block_tile',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'hello'
        }
      ]
    }
  ]
},{
  type: 'block_tile',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'world'
        }
      ]
    }
  ]
}])

const fg2 = Fragment.fromJSON(schema, [{
  type: 'block_tile',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'heihei'
        }
      ]
    }
  ]
}])

// const fg3 = fg.append(fg2)
const fg3 = fg.replaceChild(1, schema.nodes.block_tile.create({}, schema.nodes.paragraph.create({}, schema.text('heihei'))))

console.log('fg maybeChild',fg3.maybeChild(2), fg3.findIndex(10))
console.log('fg childCount',fg3.childCount)
console.log('fg cut',fg3.cut(0, 3))

fg3.forEach((node, offset, index) => {
  console.log("\n------------------------------\n")
  console.log(">>> node", node.toJSON())
  console.log(">>> offset", offset)
  console.log(">>> index", index)
  console.log("\n------------------------------\n")
})

function createCommentNode(commentText: string) {
  const commentNode = document.createElement("div");
  commentNode.className = "comment";
  commentNode.textContent = commentText;
  return commentNode;
}


// import { isAllowBold, isAllowItalic, isBold, isItalic, toggleBold, toggleItalic } from '../utils/setMark'

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;
  
  const editorRoot = document.createElement('div');
  editorRoot.id = 'editorRoot';

// 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      tableEditing(),
      columnResizing(),
      highlightCodePlugin(),
      keymap({
        ...baseKeymap,
        'Mod-a': chainCommands(selectAllCodeCmd, baseKeymap['Mod-a']),
        Enter: chainCommands(insertParagraphCommand, baseKeymap['Enter'])
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
                    insertParagraph(view, '新段落');
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
                },
                {
                  label: '添加代码块',
                  handler: ({ state, dispatch, view }) => {
                    createCodeBlockCmd(state, dispatch, view)
                    setTimeout(() => {
                      view.focus()
                    })
                  }
                },
                {
                  label: '添加 3x4 表格',
                  handler: ({ state, dispatch, view }) => {
                    createTable(view, 3, 4)
                    setTimeout(() => {
                      view.focus()
                    })
                  }
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
            },
            {
              name: '其他',
              menus: [
                {
                  label: '向已选单元格填充 "1"',
                  attrs: {
                    disabled: 'true'
                  },
                  handler({ state, view }) {
                    const tableRect = selectedRect(state);
                    if (!tableRect) return;

                    const selectedCellsPos = tableRect.map.cellsInRect(tableRect).map(reltivePos => reltivePos + tableRect.tableStart)

                    console.log('state.doc.nodeAt(pos)',selectedCellsPos)

                    let tr = state.tr;
                    selectedCellsPos.forEach((pos) => {
                      const newPos = tr.mapping.map(pos)
                      const cell = tr.doc.nodeAt(newPos)

                      if (cell && cell.type.name === 'table_cell') {
                        tr.replaceWith(newPos + 2, newPos + 2 + cell.textContent.length, state.schema.text('1'))
                      }
                      
                      console.log('cell', cell)
                    })
                    console.log('tr', tr)
                    view.dispatch(tr)
                  },
                  update(view, state, menuDom) {
                    const selection = state.selection;
                    if (selection instanceof CellSelection && menuDom.getAttribute('disabled')) {
                      menuDom.removeAttribute('disabled')
                    }
                    if (!(selection instanceof CellSelection) && !menuDom.getAttribute('disabled')) {
                      menuDom.setAttribute('disabled', 'true')
                    }
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
    nodeViews: {
      code_block: codeBlockViewConstructor
    },
    // decorations(state) {
    //   console.log(">>>> decs")
    //   const decoration = Decoration.inline(5,10, { style: 'color: red' });
    //   return DecorationSet.create(state.doc, [decoration]);
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