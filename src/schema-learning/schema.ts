import { EditorView } from 'prosemirror-view';
import { Schema } from "prosemirror-model";
import { tableNodes } from 'prosemirror-tables';
import { codeBlock } from './codeblock'

const { table, table_cell, table_header, table_row} = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {
    background: {
      default: null,
      getFromDOM(dom) {
        return dom.style.backgroundColor || null;
      },
      setDOMAttr(value, attrs) {
        if (value)
          attrs.style = (attrs.style || '') + `background-color: ${value};`;
      },
    },
  }
})

export const schema = new Schema({
  nodes: {
    doc: {
      content: 'tile+',
    },
    block_tile: {
      content: 'block',
      group: 'tile',
      inline: false,
      draggable: true,
      selectable: true,
      toDOM: () => {
        const blockTile = document.createElement('div');
        blockTile.classList.add('block_tile');
        return {
          dom: blockTile,
          contentDOM: blockTile
        }
        // return [ 'div', { 'class': "block_tile" }, 0 ]
      },
      parseDOM: [
        {
          tag: 'div.block_tile',
        }
      ]
    },
    paragraph: {
      content: 'inline*',
      group: 'block',
      // selectable: false,
      // whitespace: 'pre',
      toDOM: () => {
        return ['p', 0]
      },
      parseDOM: [{ tag: 'p' }]
    },
    heading: {
      attrs: {
        level: {
          default: 1
        }
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      marks: 'italic',
      toDOM: (node) => {
        const tag = 'h' + node.attrs.level
        return [tag, 0]
      },
      parseDOM: [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } },
      ]
    },
    text: {
      group: 'inline'
    },
    blockquote: {
      content: 'paragraph+',
      group: 'block',
      defining: true,
      isolating: true,
      toDOM: () => {
        return ['blockquote', 0]
      },
      parseDOM: [
        { tag: 'blockquote' }
      ]
    },
    datetime: {
      group: 'inline',
      inline: true,
      atom: true,
      attrs: {
        timestamp: {
          default: null
        }
      },
      toDOM(node) {
        const dom = document.createElement('span');
        dom.classList.add('datetime')
        dom.dataset.timestamp = node.attrs.timestamp;
        console.log('node.attrs',node.attrs)
        
        let time = '';
        if (node.attrs.timestamp) {
          const date = new Date(node.attrs.timestamp)
          time = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        }

        const label = document.createElement('label');
        label.innerText = '请选择时间';

        const input = document.createElement('input');
        input.type="date";
        input.value = time;

        input.addEventListener('input', (event) => {
          dom.dataset.timestamp = new Date((event.target as HTMLInputElement).value).getTime().toString()
        })

        dom.appendChild(label)
        dom.appendChild(input)

        return dom;
      },
      parseDOM: [
        {
          tag: 'span.datetime',
          getAttrs(htmlNode) {
            if (typeof htmlNode !== 'string') {
              const timestamp = htmlNode.dataset.timestamp;
              return {
                timestamp: timestamp ? Number(timestamp) : null
              }
            };
            return {
              timestamp: null
            }
          }
        }
      ]
    },
    code_block: codeBlock,
    table,
    table_cell,
    table_header,
    table_row
  },
  marks: {
    // 常见的 mark
    // 加粗 strong(语义化)
    bold: {
      toDOM: () => {
        return ['strong', 0]
      },
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (domNode) => (domNode as HTMLElement).style.fontWeight !== 'normal' && null },
        { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2})$/.test(value as string) && null }
      ]
    },
    // 斜体 em
    italic: {
      toDOM: () => {
        return ['em', 0]
      },
      parseDOM: [
        { tag: 'em' },
        { tag: 'i', getAttrs: (domNode) => (domNode as HTMLElement).style.fontStyle !== 'normal' && null},
        { style: 'font-style=italic' },
      ]
    },
    // 链接
    link: {
      attrs: {
        href: {
          default: null
        },
        ref: {
          default: 'noopener noreferrer nofollow'
        },
        target: {
          default: '_blank'
        },
      },
      toDOM: (mark) => {
        const { href, ref, target } = mark.attrs;
        return ['a', { href, ref, target  }, 0]
      },
      parseDOM: [
        {
          tag: 'a[href]:not([href *= "javascript:" i])'
        }
      ]
    },
    // 删除线 s
    strike: {
      toDOM: () => {
        return ['s', 0]
      },
      parseDOM: [
        { tag: 's' },
        { tag: 'del', getAttrs: (domNode) => (domNode as HTMLElement).style.textDecoration !== 'line-through' && null },
        { style: 'text-decoration', getAttrs: (value) => value === 'line-through' && null }
      ]
    },
    // 下划线 u
    underline: {
      toDOM: () => {
        return ['u', 0]
      },
      parseDOM: [
        { tag: 'u' },
        { style: 'text-decoration', getAttrs: (value) => value === 'underline' && null }
      ]
    },
    // 上标 sup
    sup: {
      spanning: false,
      excludes: '_',
      toDOM: () => {
        return ['sup', 0]
      },
      parseDOM: [
        { tag: 'sup' },
      ]
    },
    // 下标 sub
    sub: {
      spanning: false,
      excludes: '_',
      toDOM: () => {
        return ['sub', 0]
      },
      parseDOM: [
        { tag: 'sub' },
      ]
    },
    // 行内代码 code
    code: {
      toDOM: () => {
        return ['code', { class: 'inline-code' }, 0]
      },
      parseDOM: [
        { tag: 'code[inline-code]' },
      ]
    },
    // 字体大小
    // 字体
    // 字体颜色
    // 背景颜色
    // 对齐方式
    fontStyle: {
      attrs: {
        color: {
          default: null
        },
        backgroundColor: {
          default: null
        },
        fontSize: {
          default: null
        },
        fontFamily: {
          default: null
        }
      },
      toDOM: (mark) => {
        const span = document.createElement('span');
        span.style.color = mark.attrs.color ?? undefined;
        span.style.backgroundColor = mark.attrs.backgroundColor ?? undefined;
        span.style.fontSize = mark.attrs.fontSize ?? undefined;
        span.style.fontFamily = mark.attrs.fontFamily ?? undefined;

        return {
          dom: span,
          contentDOM: span
        }
      },
      parseDOM: [
        {
          tag: 'span',
          getAttrs: (domNode) => {
            const { color, backgroundColor, fontSize, fontFamily } = (domNode as HTMLElement).style;
            
            let attrs = Object.assign(Object.create(null), {
              color,
              backgroundColor,
              fontSize,
              fontFamily
            });
            
            attrs = Object.keys(attrs).reduce<Record<string, string>>((result, key) => {
              if (attrs[key]) {
                result[key] = attrs[key]
              }
              return result;
            }, {});

            if (Object.keys(attrs).length) {
              return attrs;
            }
            return false;
          }
        }
      ]
    }
  },
  topNode: 'doc'
})

export function createTable(view: EditorView, row: number, col: number) {
  const { state } = view;
  const schema = state.schema;
  const rows = Array
    .from({length: row})
    .map(() => schema.nodes.table_row.create({}, 
      Array.from({length: col})
        .map(() => schema.nodes.table_cell.create({}, schema.nodes.paragraph.create()))
    ))
  const tableNode = schema.nodes.table.create({}, rows);
  const blockTile = schema.nodes.block_tile.create({}, tableNode);
  
  const tr = state.tr.replaceSelectionWith(blockTile)

  view.dispatch(tr)
}

console.log("schema", schema)