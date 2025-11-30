<template>
  <div class="tree-node">
    <div class="tree-node-content" @click="$emit('select', node)">
      <span v-if="hasChildren" @click.stop="toggle" class="tree-toggle">
        <i :class="expanded ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
      </span>
      <span class="tree-icon">
        <i
          :class="hasChildren ? 'bi bi-folder-fill' : 'bi bi-file-earmark'"
          :style="hasChildren ? 'margin-right: 4px; color: #FFC107;' : 'margin-right: 4px'"
        ></i>
      </span>
      <span class="tree-label">{{ node.codeName }}</span>
    </div>
    <div v-if="expanded && hasChildren" class="tree-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.codeId"
        :node="child"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TreeNode',
  props: {
    node: { type: Object, required: true },
  },
  data() {
    return {
      expanded: true,
    }
  },
  computed: {
    hasChildren() {
      return this.node.children && this.node.children.length > 0
    },
  },
  methods: {
    toggle() {
      this.expanded = !this.expanded
    },
  },
}
</script>

<style scoped>
.tree-node {
  margin-left: 16px;
}
.tree-node-content {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 2px 0;
}
.tree-toggle {
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.tree-icon {
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tree-label {
  margin-left: 2px;
}
.tree-children {
  margin-left: 16px;
}
</style>
