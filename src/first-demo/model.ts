import { Schema } from 'prosemirror-model';

export const schema = new Schema({
  nodes: {
    // 整个文档
    doc: {
      // 文档内容规定必须是 block 类型的节点（block 与 HTML 中的 block 概念差不多） `+` 号代表可以有一个或多个（规则类似正则）
      content: 'block+'
    },
    // 文档段落
    paragraph: {
      // 段落内容规定必须是 inline 类型的节点（inline 与 HTML 中 inline 概念差不多）, `*` 号代表可以有 0 个或多个（规则类似正则）
      content: 'inline*',
      // 分组：当前节点所在的分组为 block，意味着它是个 block 节点
      group: 'block',
      // 渲染为 html 时候，使用 p 标签渲染，第二个参数 0 念做 “洞”，类似 vue 中 slot 插槽的概念，
      // 证明它有子节点，以后子节点就填充在 p 标签中
      toDOM: () => {
        return ['p', 0]
      },
      // 从别处复制过来的富文本，如果包含 p 标签，将 p 标签序列化为当前的 p 节点后进行展示
      parseDOM: [{
        tag: 'p'
      }]
    },
    // 段落中的文本
    text: {
      // 当前处于 inline 分株，意味着它是个 inline 节点。代表输入的文本
      group: 'inline'
    },
    // 1-6 级标题
    heading: {
      // attrs 与 vue/react 组件中 props 的概念类似，代表定义当前节点有哪些属性，这里定义了 level 属性，默认值 1
      attrs: {
        level: {
          default: 1
        }
      },
      // 当前节点内容可以是 0 个或多个 inline 节点
      content: 'inline*',
      // 当前节点分组为 block 分组
      group: 'block',
      // defining: 特殊属性，为 true 代表如果在当前标签内（以 h1 为例），全选内容，直接粘贴新的内容后，这些内容还会被 h1 标签包裹
      // 如果为 false, 整个 h1 标签（包括内容与标签本身）将会被替换为其他内容，删除亦如此。
      // 还有其他的特殊属性，后续细说
      defining: true,
      // 转为 html 标签时，根据当前的 level 属性，生成对应的 h1 - h6 标签，节点的内容填充在 h 标签中（“洞”在）。
      toDOM(node) {
        const tag = `h${node.attrs.level}`
        return [tag, 0]
      },
      // 从别处复制进来的富文本内容，根据标签序列化为当前 heading 节点，并填充对应的 level 属性
      parseDOM: [
        {tag: "h1", attrs: {level: 1}},
        {tag: "h2", attrs: {level: 2}},
        {tag: "h3", attrs: {level: 3}},
        {tag: "h4", attrs: {level: 4}},
        {tag: "h5", attrs: {level: 5}},
        {tag: "h6", attrs: {level: 6}}
      ],
    }
  },
  // 除了上面定义 node 节点，一些富文本样式，可以通过 marks 定义
  marks: {
    // 文本加粗
    strong: {
      // 对于加粗的部分，使用 strong 标签包裹，加粗的内容位于 strong 标签内(这里定义的 0 与上面一致，也念做 “洞”，也类似 vue 中的 slot)
      toDOM() {
        return ['strong', 0]
      },
      // 从别的地方复制过来的富文本，如果有 strong 标签，则被解析为一个 strong mark
      parseDOM: [
        { tag: 'strong' },
      ],
    }
  }
})

// schema 的 cached 可以用来缓存自己的数据，默认有 domParser 与 domSerializer
schema.cached.sayHello = function(name: string) {
  console.log('hello: ', name)
}
