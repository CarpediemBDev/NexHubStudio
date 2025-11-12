<template>
  <div class="equipment-monitor-container">
    <div class="monitor-header">
      <h1>설비 모니터링 대시보드</h1>
      <div class="header-controls">
        <div class="floor-selector">
          <label>층 선택:</label>
          <select v-model="selectedFloor" class="form-select form-select-sm">
            <option value="">전체</option>
            <option value="1F">1층</option>
            <option value="2F">2층</option>
            <option value="3F">3층</option>
          </select>
        </div>
        <div class="status-legend">
          <span class="legend-item"> <span class="status-dot normal"></span> 정상 </span>
          <span class="legend-item"> <span class="status-dot warning"></span> 경고 </span>
          <span class="legend-item"> <span class="status-dot error"></span> 오류 </span>
          <span class="legend-item"> <span class="status-dot maintenance"></span> 유지보수 </span>
          <span class="legend-item"> <span class="status-dot offline"></span> 오프라인 </span>
        </div>
        <div class="polling-info">
          <span class="badge bg-secondary"> 자동갱신: {{ pollingInterval / 1000 }}초 </span>
          <span class="badge bg-info"> 마지막 업데이트: {{ lastUpdateTime }} </span>
        </div>
      </div>
    </div>

    <div class="equipment-map">
      <!-- 로딩/에러 상태 표시 -->
      <div v-if="isLoading && equipments.length === 0" class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">설비 데이터를 불러오는 중...</p>
      </div>

      <div v-else-if="loadingError" class="alert alert-danger m-3">
        <h5 class="alert-heading">데이터 로드 실패</h5>
        <p>{{ loadingError }}</p>
        <button class="btn btn-sm btn-danger" @click="loadEquipments">재시도</button>
      </div>

      <div v-else-if="equipments.length === 0" class="alert alert-info m-3">
        <h5 class="alert-heading">설비 데이터 없음</h5>
        <p>등록된 설비가 없습니다. 백엔드에서 샘플 데이터를 확인하세요.</p>
        <button class="btn btn-sm btn-info" @click="loadEquipments">새로고침</button>
      </div>

      <div v-else class="map-container" ref="mapContainer">
        <div
          v-for="equipment in filteredEquipments"
          :key="equipment.id"
          class="equipment-item"
          :style="getEquipmentStyle(equipment)"
          :class="getEquipmentClass(equipment)"
          @click="showEquipmentDetail(equipment)"
          :title="`${equipment.equipmentName} - ${getStatusText(equipment.status)}`"
        >
          <div class="equipment-icon">
            <i :class="getEquipmentIcon(equipment.equipmentType)"></i>
          </div>
          <div class="equipment-label">
            {{ equipment.equipmentCode }}
          </div>
          <div
            class="equipment-status-indicator"
            :style="{ backgroundColor: equipment.statusColor }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 설비 상세 정보 모달 -->
    <div
      v-if="selectedEquipment"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedEquipment.equipmentName }}</h5>
            <button type="button" class="btn-close" @click="closeDetail"></button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <h6>기본 정보</h6>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <th>설비 코드</th>
                    <td>{{ selectedEquipment.equipmentCode }}</td>
                  </tr>
                  <tr>
                    <th>설비 타입</th>
                    <td>{{ selectedEquipment.equipmentType }}</td>
                  </tr>
                  <tr>
                    <th>층</th>
                    <td>{{ selectedEquipment.floor }}</td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>
                      <span
                        class="badge"
                        :style="{ backgroundColor: selectedEquipment.statusColor }"
                      >
                        {{ getStatusText(selectedEquipment.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="detail-section">
              <h6>센서 데이터</h6>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <th>온도</th>
                    <td>{{ selectedEquipment.temperature }}°C</td>
                  </tr>
                  <tr>
                    <th>압력</th>
                    <td>{{ selectedEquipment.pressure }} Torr</td>
                  </tr>
                  <tr>
                    <th>사이클 횟수</th>
                    <td>{{ selectedEquipment.cycleCount.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <th>마지막 점검</th>
                    <td>{{ formatDateTime(selectedEquipment.lastCheckTime) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="detail-section" v-if="selectedEquipment.description">
              <h6>설명</h6>
              <p>{{ selectedEquipment.description }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetail">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'EquipmentMonitorPage',
  data() {
    return {
      equipments: [],
      selectedFloor: '',
      selectedEquipment: null,
      pollingInterval: 5000, // 5초마다 갱신
      pollingTimer: null,
      lastUpdateTime: '--:--:--',
      loadingError: null,
      isLoading: false,
    }
  },
  computed: {
    filteredEquipments() {
      if (!this.selectedFloor) {
        return this.equipments
      }
      return this.equipments.filter((eq) => eq.floor === this.selectedFloor)
    },
  },
  mounted() {
    this.loadEquipments()
    this.startPolling()
  },
  beforeUnmount() {
    this.stopPolling()
  },
  methods: {
    loadEquipments() {
      this.isLoading = true
      this.loadingError = null

      const url = this.selectedFloor
        ? `http://localhost:8080/api/equipments/floor/${this.selectedFloor}`
        : 'http://localhost:8080/api/equipments'

      axios
        .get(url)
        .then((response) => {
          console.log('설비 데이터:', response.data)
          this.equipments = response.data.data || []
          this.lastUpdateTime = new Date().toLocaleTimeString()
          this.isLoading = false
        })
        .catch((error) => {
          console.error('설비 데이터 로드 실패:', error)
          this.loadingError = `API 호출 실패: ${error.message}. 백엔드가 실행 중인지 확인하세요. (URL: ${url})`
          this.isLoading = false
        })
    },
    startPolling() {
      this.pollingTimer = setInterval(() => {
        this.loadEquipments()
      }, this.pollingInterval)
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
      }
    },
    getEquipmentStyle(equipment) {
      return {
        left: `${equipment.positionX}px`,
        top: `${equipment.positionY}px`,
      }
    },
    getEquipmentClass(equipment) {
      return `status-${equipment.status.toLowerCase()}`
    },
    getEquipmentIcon(type) {
      const iconMap = {
        CVD: 'bi bi-cpu',
        ETCHING: 'bi bi-lightning',
        LITHOGRAPHY: 'bi bi-grid-3x3',
        ION_IMPLANT: 'bi bi-radioactive',
        CMP: 'bi bi-gear',
        INSPECTION: 'bi bi-search',
      }
      return iconMap[type] || 'bi bi-box'
    },
    getStatusText(status) {
      const statusMap = {
        NORMAL: '정상',
        WARNING: '경고',
        ERROR: '오류',
        MAINTENANCE: '유지보수',
        OFFLINE: '오프라인',
      }
      return statusMap[status] || status
    },
    showEquipmentDetail(equipment) {
      this.selectedEquipment = equipment
    },
    closeDetail() {
      this.selectedEquipment = null
    },
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return '-'
      const date = new Date(dateTimeStr)
      return date.toLocaleString('ko-KR')
    },
  },
}
</script>

<style scoped>
.equipment-monitor-container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.monitor-header {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.monitor-header h1 {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #333;
}

.header-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.floor-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.floor-selector label {
  margin: 0;
  font-weight: 500;
}

.floor-selector select {
  width: 120px;
}

.status-legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.normal {
  background-color: #28a745;
}

.status-dot.warning {
  background-color: #ffc107;
}

.status-dot.error {
  background-color: #dc3545;
}

.status-dot.maintenance {
  background-color: #6c757d;
}

.status-dot.offline {
  background-color: #343a40;
}

.polling-info {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.equipment-map {
  background: white;
  border-radius: 10px;
  padding: 20px;
  min-height: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.map-container {
  position: relative;
  width: 100%;
  height: 600px;
  background-image: linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
}

.equipment-item {
  position: absolute;
  width: 80px;
  height: 80px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.equipment-item:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.equipment-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.equipment-label {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.equipment-status-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.equipment-item.status-normal {
  border-color: #28a745;
}

.equipment-item.status-warning {
  border-color: #ffc107;
}

.equipment-item.status-error {
  border-color: #dc3545;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

.equipment-item.status-maintenance {
  border-color: #6c757d;
  opacity: 0.7;
}

.equipment-item.status-offline {
  border-color: #343a40;
  opacity: 0.5;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h6 {
  font-weight: 600;
  margin-bottom: 10px;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 5px;
}

.detail-section table th {
  width: 120px;
  font-weight: 600;
  color: #495057;
}

.modal.show {
  opacity: 1;
}
</style>
