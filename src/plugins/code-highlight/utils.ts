import type { NodeType, Node as PMNode } from "prosemirror-model";

export interface NodeWithPos {
  node: PMNode;
  pos: number;
}

/**
 * 获取所有指定类型的 node
 * 
 * @param doc 
 * @param type 
 * @returns 
 */
export function findNodesOfType(doc: PMNode, type: string | string[] | NodeType | NodeType[]) {
  const schema = doc.type.schema;

  const tempTypes: string[] | NodeType[] = Array.isArray(type) ? type : [type] as (string[] | NodeType[])
  const types = tempTypes
    .map(item => typeof item === 'string' ? schema.nodes[item] : item)
    .filter(item => item)

  const nodes: NodeWithPos[] = [];

  doc.descendants((node, pos) => {
    if (types.includes(node.type)) {
      nodes.push({
        node,
        pos
      })
    }
  })
  
  return nodes;
}