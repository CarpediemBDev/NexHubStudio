<template>
  <div class="test-page" style="padding: 20px;">
    <h2>JqxGrid Width Test</h2>
    
    <div style="display: flex; gap: 30px; flex-direction: column;">
      
      <!-- Case 1: Fixed (Attempt with No Width) -->
      <div class="grid-container">
        <h3>1. Previous Attempt (Your Screenshot)</h3>
        <p>Removing <code>width</code> from one column helps, but borders/padding might still cause 1-2px overflow.</p>
        <JqxCustomGrid
          ref="grid2"
          :localdata="rows"
          :datafields="datafields"
          :columns="columnsFixed"
          selectionmode="checkbox"
          :height="200"
          :width="'100%'"
        />
      </div>

      <!-- Case 2: Grid Width Adjustment -->
      <div class="grid-container highlight">
        <h3>2. Real Solution: <code>width="99.8%"</code> or <code>calc(100% - 2px)</code></h3>
        <p>If the scrollbar is very small (1-2px), it's a border calculation issue. Reducing the grid width slightly fixes it entirely.</p>
        <JqxCustomGrid
          ref="grid3"
          :localdata="rows"
          :datafields="datafields"
          :columns="columnsFixed"
          selectionmode="checkbox"
          :height="200"
          :width="'99.8%'"
        />
      </div>

       <!-- Case 3: No Width Column + Explicit Width Adjustment -->
       <div class="grid-container">
        <h3>3. Alternative: <code>calc(100% - 2px)</code></h3>
        <p>Using CSS calc to subtract the exact border width (usually 2px).</p>
        <JqxCustomGrid
          ref="grid4"
          :localdata="rows"
          :datafields="datafields"
          :columns="columnsFixed"
          selectionmode="checkbox"
          :height="200"
          :width="'calc(100% - 2px)'"
        />
      </div>

    </div>
  </div>
</template>

<script>
import JqxCustomGrid from '@/components/JqxCustomGrid.vue'

export default {
  name: 'JqxGridTestPage',
  components: { JqxCustomGrid },
  data() {
    return {
      rows: [
        { name: 'Apple', type: 'Fruit', price: 100, stock: 50, description: 'Fresh red apple from farm' },
        { name: 'Banana', type: 'Fruit', price: 50, stock: 100, description: 'Sweet yellow banana' },
        { name: 'Carrot', type: 'Vegetable', price: 30, stock: 200, description: 'Crunchy orange carrot' },
      ],
      datafields: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
        { name: 'description', type: 'string' },
      ],
    }
  },
  computed: {
    columnsFixed() {
      return [
        { text: 'Name', datafield: 'name', width: '20%' },
        { text: 'Type', datafield: 'type', width: '20%' },
        { text: 'Price', datafield: 'price', width: '15%' },
        { text: 'Stock', datafield: 'stock', width: '15%' },
        // No width property at all
        { text: 'Description', datafield: 'description' }, 
      ]
    }
  }
}
</script>

<style scoped>
.grid-container {
  border: 1px solid #ddd;
  padding: 15px;
  background: #f9f9f9;
}
.highlight {
  border: 2px solid #42b983;
  background: #c0df0c;
}
h3 { margin-top: 0; }
</style>
