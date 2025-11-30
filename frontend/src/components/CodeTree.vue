<template>
  <div class="tree-list">
    <TreeNode v-for="node in treeData" :key="node.codeId" :node="node" @select="onSelect" />
  </div>
</template>

<script>
import TreeNode from './TreeNode.vue'

export default {
  name: 'CodeTree',
  components: { TreeNode },
  props: {
    codes: {
      type: Array,
      required: true,
    },
  },
  computed: {
    treeData() {
      // codes 배열을 트리 구조로 변환 (parentId가 id를 참조하는 경우 지원)
      const map = {}
      this.codes.forEach((code) => {
        map[code.id ?? code.codeId] = { ...code, children: [] }
      })
      const tree = []
      this.codes.forEach((code) => {
        // parentId가 null/undefined/0이면 루트로 처리
        if (code.parentId != null) {
          // parentId가 id(숫자) 또는 codeId(문자열)일 수 있음
          const parentKey = map[code.parentId] ? code.parentId : code.parentId?.toString()
          if (map[parentKey]) {
            map[parentKey].children.push(map[code.id ?? code.codeId])
          } else {
            tree.push(map[code.id ?? code.codeId]) // 부모 못 찾으면 루트로 처리
          }
        } else {
          tree.push(map[code.id ?? code.codeId])
        }
      })
      return tree
    },
  },
  methods: {
    onSelect(node) {
      this.$emit('select', node)
    },
  },
}
</script>

<!-- TreeNode.vue는 재귀적으로 children을 렌더링하는 컴포넌트로 별도 생성 필요 -->
