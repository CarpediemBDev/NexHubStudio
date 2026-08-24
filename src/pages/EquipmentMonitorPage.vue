<template>
  <div class="equipment-monitor-container bg-theme-main text-theme-primary min-vh-100 p-3">
    <!-- 대시보드 헤더 카드 (Dark Navy / Light 전역 테마 완벽 연동) -->
    <div class="monitor-header b2b-card p-3 mb-3">
      <h1 class="b2b-text-h1 text-theme-primary mb-3">설비 모니터링 대시보드</h1>
      <div class="header-controls d-flex flex-wrap align-items-center gap-3">
        <div class="floor-selector d-flex align-items-center gap-2">
          <label class="b2b-text-body text-theme-primary fw-semibold mb-0">층 선택:</label>
          <select v-model="selectedFloor" class="form-select form-select-sm b2b-text-body bg-theme-card text-theme-primary border-theme" style="width: 110px;">
            <option value="">전체</option>
            <option value="1F">1층</option>
            <option value="2F">2층</option>
            <option value="3F">3층</option>
          </select>
        </div>
        <div class="status-legend d-flex align-items-center gap-3">
          <span class="legend-item text-theme-primary b2b-text-sm"> <span class="status-dot normal me-1"></span> 정상 </span>
          <span class="legend-item text-theme-primary b2b-text-sm"> <span class="status-dot warning me-1"></span> 경고 </span>
          <span class="legend-item text-theme-primary b2b-text-sm"> <span class="status-dot error me-1"></span> 오류 </span>
          <span class="legend-item text-theme-primary b2b-text-sm"> <span class="status-dot maintenance me-1"></span> 유지보수 </span>
          <span class="legend-item text-theme-primary b2b-text-sm"> <span class="status-dot offline me-1"></span> 오프라인 </span>
        </div>
        <div class="polling-info ms-auto d-flex gap-2 align-items-center">
          <span class="b2b-badge b2b-badge-secondary"> 자동갱신: {{ pollingInterval / 1000 }}초 </span>
          <span class="b2b-badge b2b-badge-primary"> 마지막 업데이트: {{ lastUpdateTime }} </span>
        </div>
      </div>
    </div>

    <!-- 맵 및 데이터 상태 구역 -->
    <div class="equipment-map b2b-card p-4">
      <!-- 로딩 상태 표시 -->
      <div v-if="isLoading && equipments.length === 0" class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-theme-secondary b2b-text-sm">설비 데이터를 불러오는 중...</p>
      </div>

      <!-- 로딩 에러 상태 -->
      <div v-else-if="loadingError" class="b2b-card bg-theme-card border-danger p-4 m-3 text-center">
        <h5 class="b2b-text-h2 text-danger mb-2">데이터 로드 실패</h5>
        <p class="b2b-text-sm text-theme-secondary mb-3">{{ loadingError }}</p>
        <button class="btn-b2b-danger btn-sm" @click="loadEquipments">재시도</button>
      </div>

      <!-- 설비 데이터 없음 (Dark Navy 전역 카드 테마 적용) -->
      <div v-else-if="equipments.length === 0" class="b2b-card bg-theme-card border-theme p-5 m-3 text-center">
        <i class="bi bi-cpu fs-1 text-theme-secondary opacity-75 d-block mb-3"></i>
        <h5 class="b2b-text-h2 text-theme-primary mb-2">설비 데이터 없음</h5>
        <p class="b2b-text-sm text-theme-secondary mb-3">등록된 설비가 없습니다. 백엔드에서 샘플 데이터를 확인하세요.</p>
        <button class="btn-b2b-primary btn-sm" @click="loadEquipments">
          <i class="bi bi-arrow-clockwise me-1"></i> 새로고침
        </button>
      </div>

      <!-- 설비 위치 맵 -->
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
          <div class="equipment-label text-theme-primary">
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
      style="background-color: rgba(0, 0, 0, 0.6)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content b2b-card bg-theme-card text-theme-primary border-theme shadow-lg">
          <div class="modal-header b2b-modal-header">
            <h5 class="b2b-modal-title text-theme-primary">{{ selectedEquipment.equipmentName }}</h5>
            <button type="button" class="btn-close b2b-text-sm" @click="closeDetail"></button>
          </div>
          <div class="modal-body p-3">
            <div class="detail-section mb-3">
              <h6 class="b2b-text-h2 text-theme-primary pb-1 mb-2 border-bottom border-theme">기본 정보</h6>
              <table class="table table-sm text-theme-primary align-middle mb-0">
                <tbody>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm" style="width: 120px;">설비 코드</th>
                    <td class="b2b-text-body">{{ selectedEquipment.equipmentCode }}</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">설비 타입</th>
                    <td class="b2b-text-body">{{ selectedEquipment.equipmentType }}</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">층</th>
                    <td class="b2b-text-body">{{ selectedEquipment.floor }}</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">상태</th>
                    <td>
                      <span
                        class="b2b-badge"
                        :style="{ backgroundColor: selectedEquipment.statusColor, color: '#ffffff' }"
                      >
                        {{ getStatusText(selectedEquipment.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="detail-section mb-3">
              <h6 class="b2b-text-h2 text-theme-primary pb-1 mb-2 border-bottom border-theme">센서 데이터</h6>
              <table class="table table-sm text-theme-primary align-middle mb-0">
                <tbody>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm" style="width: 120px;">온도</th>
                    <td class="b2b-text-body">{{ selectedEquipment.temperature }}°C</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">압력</th>
                    <td class="b2b-text-body">{{ selectedEquipment.pressure }} Torr</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">사이클 횟수</th>
                    <td class="b2b-text-body">{{ selectedEquipment.cycleCount.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <th class="text-theme-secondary b2b-text-sm">마지막 점검</th>
                    <td class="b2b-text-body">{{ formatDateTime(selectedEquipment.lastCheckTime) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="detail-section" v-if="selectedEquipment.description">
              <h6 class="b2b-text-h2 text-theme-primary pb-1 mb-2 border-bottom border-theme">설명</h6>
              <p class="b2b-text-sm text-theme-secondary mb-0">{{ selectedEquipment.description }}</p>
            </div>
          </div>
          <div class="modal-footer b2b-modal-footer">
            <button type="button" class="btn-b2b-action btn-sm" @click="closeDetail">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from '@/utils/toastUtil.js'
import axios from 'axios'

export default {
  name: 'EquipmentMonitorPage',
  data() {
    return {
      equipments: [],
      selectedFloor: '',
      selectedEquipment: null,
      isLoading: false,
      loadingError: null,
      pollingTimer: null,
      pollingInterval: 5000,
      lastUpdateTime: '',
    }
  },
  computed: {
    filteredEquipments() {
      if (!this.selectedFloor) {
        return this.equipments
      }
      return this.equipments.filter((e) => e.floor === this.selectedFloor)
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
    async loadEquipments() {
      this.isLoading = true
      this.loadingError = null
      try {
        const response = await axios.get('/api/equipments')
        this.equipments = response.data.map((eq) => ({
          ...eq,
          statusColor: this.getStatusColor(eq.status),
        }))
        this.lastUpdateTime = new Date().toLocaleTimeString()
      } catch (error) {
        console.error('설비 데이터 로드 실패:', error)
        this.loadingError = '설비 데이터를 불러오는데 실패했습니다.'
        this.equipments = []
      } finally {
        this.isLoading = false
      }
    },
    startPolling() {
      this.pollingTimer = setInterval(() => {
        this.loadEquipments()
      }, this.pollingInterval)
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
    },
    getStatusColor(status) {
      const colorMap = {
        NORMAL: '#28a745',
        WARNING: '#ffc107',
        ERROR: '#dc3545',
        MAINTENANCE: '#6c757d',
        OFFLINE: '#64748b',
      }
      return colorMap[status] || '#6c757d'
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
    getEquipmentIcon(type) {
      const iconMap = {
        ETCHER: 'bi bi-lightning-charge-fill',
        CLEANER: 'bi bi-droplet-fill',
        INSPECTOR: 'bi bi-search',
        PACKAGER: 'bi bi-box-seam',
      }
      return iconMap[type] || 'bi bi-cpu'
    },
    getEquipmentStyle(equipment) {
      return {
        left: `${equipment.posX || 0}px`,
        top: `${equipment.posY || 0}px`,
      }
    },
    getEquipmentClass(equipment) {
      return {
        [`status-${equipment.status.toLowerCase()}`]: true,
      }
    },
    showEquipmentDetail(equipment) {
      this.selectedEquipment = equipment
    },
    closeDetail() {
      this.selectedEquipment = null
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleString()
    },
  },
}
</script>

<style scoped>
.equipment-monitor-container {
  min-height: 100vh;
  background-color: var(--bg-main) !important;
  color: var(--text-primary) !important;
}

.monitor-header {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px;
  color: var(--text-primary) !important;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-primary) !important;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.normal { background-color: #28a745; }
.status-dot.warning { background-color: #ffc107; }
.status-dot.error { background-color: var(--b2b-color-danger); }
.status-dot.maintenance { background-color: var(--b2b-color-text-muted); }
.status-dot.offline { background-color: #64748b; }

.equipment-map {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px;
  min-height: 600px;
  color: var(--text-primary) !important;
}

.map-container {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: var(--bg-subcard) !important;
  background-image: linear-gradient(var(--border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  background-size: 50px 50px;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px;
}

.equipment-item {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: var(--bg-card) !important;
  border: 2px solid var(--border-color) !important;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.equipment-item:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  border-color: var(--b2b-color-primary) !important;
  z-index: 10;
}

.equipment-icon {
  font-size: 22px;
  margin-bottom: 4px;
  color: var(--text-primary) !important;
}

.equipment-label {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary) !important;
}

.equipment-status-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.detail-section h6 {
  font-weight: 600;
}
</style>
