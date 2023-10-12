import { EditorView } from "prosemirror-view";
import { schema } from '../schema-learning/schema';

type Schema = typeof schema;

/**
 * 插入段落
 * @param editorView 
 * @param content 
 */
export function insertParagraph(editorView: EditorView, content: string) {
  const { state, dispatch } = editorView;
  const schema = state.schema as Schema;

  // 通过 schema.node 创建一个 paragraph 节点，这里用的是字符串，对应 paragraph 的名字（对应在创建 schema 时候的 key）
  // 第二个参数是 attrs，即对应到 Vue React 中的 props，如果没有需要传 空对象
  // 内容为 文本，文本内容为 content 对应字符串，schema.text 可以快速创建文本结点
  const paragraph = schema.node('paragraph', {}, schema.text(content));
  // 这里通过 schema.node 创建一个 block_tile 节点，这里通过直接拿到 block_tile 对应的 NodeType 来创建，内容为上面的段落
  const block_tile = schema.node('block_tile', {}, paragraph);

  // 这里通过 state.selection 可以获取到选区，通过 seletion.anchor 可以获取到选区开头的位置，我们在开头插入
  // 对于 选区没有概念的，可以翻看我对浏览器原生 Selection 与 Range 的讲解文章，这里的 anchor 差不多，但直接是个位置
  const pos = state.selection.anchor;
  
  // 通过 tr.insert 在 pos 位置将我们上面创建的节点插入到文档中
  const tr = state.tr.insert(pos, block_tile);

  // 派发更新
  dispatch(tr);
}

/**
 * 插入标题
 * 
 * @param editorView 
 * @param content 
 * @param level 
 */
export function insertHeading(editorView: EditorView, content: string, level = 1) {
  const { state, dispatch } = editorView;
  const schema = state.schema as Schema;

  // const heading = schema.node(schema.nodes.heading, { level }, schema.text(content))
  // 也可以这样定义: 直接通过 node（这里的 node 对应的是我们上面讲到的 NodeType） 工厂方法创建一个 heading 实例，
  const heading = schema.nodes.heading.create({ level }, schema.text(content))
  const block_tile = schema.node(schema.nodes.block_tile, {}, heading);

  // 将当前选区选中的内容都替换为 block_tile，比如输入的时候刚好选中一段文本，插入的时候，这段文本就应该被删掉，再插入一个 block_tile
  const tr = state.tr.replaceSelectionWith(block_tile);

  // prosemirror 触发更新都是通过派发一个 tr 
  // (第一篇文章讲过，它是 Transaction 事务的实例，Transaction 是 prosemirror-transform 包中 Transform 的子类)
  // (在 MVC 模式中对应 controller 的角色，专门用来操作数据，上面就是根据 state.tr 上的方法替换了内容，之后返回一个新的 tr)
  // 通过 view.dispatch(tr) 可以将 tr 派发出去，实现视图的更新
  dispatch(tr);
}

/**
 * 插入 blockquote
 * 
 * @param editorView 
 * @param content 
 */
export function insertBlockquote(editorView: EditorView, value = '') {
  const { state, dispatch } = editorView
  const schema = state.schema as Schema;

  /**
   * 使用 JSON 描述内容，通过 state.doc.toJSON 可以看到 node 数据转 json 后的样子，就是下方一个 type, 一个 content 这种样式
   * 同样，通过 json 也能反向生成对应的 node
   */
  const jsonContent = {
    type: 'blockquote',
    content: [
      {
        type: 'paragraph',
        content: value ? [
          {
            type: 'text',
            text: value,
          }
        ] : []
      }
    ]
  }

  // 通过 nodeFromJSON 实例化 node，相比之前使用 api，使用 json 描述就非常简单快捷
  const node = schema.nodeFromJSON(jsonContent);

  const tr = state.tr.replaceWith(state.selection.from, state.selection.to, node)
  dispatch(tr);
}

/**
 * 插入时间选择器
 * 
 * @param editorView 
 * @param datetime 
 */
export function insertDatetime(editorView: EditorView, timestamp?: number) {
  const { state, dispatch } = editorView
  const schema = state.schema as Schema;

  const jsonContent = {
    type: 'datetime',
    attrs: {
      timestamp: timestamp || Date.now()
    }
  }

  const node = schema.nodeFromJSON(jsonContent);
  console.log('jsonContent',jsonContent,node)
  const tr = state.tr.replaceWith(state.selection.from, state.selection.to, node)
  dispatch(tr);
}