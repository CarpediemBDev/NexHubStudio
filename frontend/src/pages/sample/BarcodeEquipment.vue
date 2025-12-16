<template>
  <div class="p-4">
    <h2>🏭 설비 바코드 생성기</h2>
    <div class="row g-2 align-items-end">
      <div class="col-auto">
        <label>장비타입</label>
        <select v-model="type" class="form-select">
          <option value="EQ">설비(EQ)</option>
          <option value="FA">공장(FA)</option>
          <option value="QA">품질(QA)</option>
        </select>
      </div>
      <div class="col-auto">
        <label>제조년월</label>
        <input
          v-model="ym"
          type="text"
          class="form-control"
          placeholder="2512 (YYMM)"
          maxlength="4"
        />
      </div>
      <div class="col-auto">
        <label>일련번호</label>
        <input
          v-model="serial"
          type="number"
          class="form-control"
          placeholder="1"
          min="1"
          max="99999"
        />
      </div>
      <div class="col-auto d-flex gap-2">
        <button @click="makeBarcode" class="btn btn-primary">바코드 이미지 생성</button>
        <button @click="getPrice" class="btn btn-outline-success">가격 요청</button>
      </div>
    </div>
    <div v-if="showValueResult" class="mt-4">
      <div class="alert alert-info"><strong>바코드 값:</strong> {{ barcodeValue }}</div>
    </div>
    <div v-if="barcodeUrl" class="mt-4">
      <div class="mb-2"><strong>바코드 값:</strong> {{ barcodeValue }}</div>
      <img :src="barcodeUrl" alt="장비 바코드" />
    </div>
    <div v-if="price !== ''" class="alert alert-warning mt-3">
      가격: <strong>{{ price }}</strong> 원
    </div>
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
const type = ref('EQ')
const ym = ref('')
const serial = ref('')
const barcodeValue = ref('')
const barcodeUrl = ref('')
const error = ref('')
const showValueResult = ref(false)
const price = ref('')

function padSerial(num) {
  return String(num).padStart(5, '0')
}

function makeBarcode() {
  error.value = ''
  barcodeUrl.value = ''
  showValueResult.value = false
  if (!type.value || !ym.value.match(/^\d{4}$/) || !serial.value) {
    error.value = '모든 값을 올바르게 입력하세요!'
    return
  }
  barcodeValue.value = `${type.value}-${ym.value}${padSerial(serial.value)}`
  barcodeUrl.value = `http://localhost:3001/api/barcode?text=${encodeURIComponent(
    barcodeValue.value
  )}`
}

async function getPrice() {
  error.value = ''
  price.value = ''
  if (!type.value || !ym.value.match(/^\d{4}$/) || !serial.value) {
    error.value = '모든 값을 올바르게 입력하세요!'
    return
  }
  const code = `${type.value}-${ym.value}${padSerial(serial.value)}`
  try {
    // Spring 백엔드 프록시로 요청 (CORS 문제 없음)
    const res = await axios.get('/api/barcode/price', { params: { code } })
    price.value = res.data
  } catch (e) {
    error.value = '가격 요청 실패'
  }
}
</script>
