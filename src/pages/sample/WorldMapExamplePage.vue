<template>
  <div class="container-fluid py-4">
    <!-- 안내 헤더 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-subcard px-4 py-3 mb-3">
      <div class="d-flex align-items-start gap-3 flex-wrap">
        <div class="flex-grow-1">
          <h5 class="b2b-text-h2 text-theme-primary mb-1 d-flex align-items-center gap-2">
            <i class="bi bi-map text-theme-accent"></i>
            세계지도 적용 예제
          </h5>
          <p class="b2b-text-body text-theme-secondary mb-0">
            세계지도 갤러리에서 저장한 <b>SVG 파일(라이트·다크 한 쌍)</b>로 만든 실제 화면입니다. 지도 패키지(d3 등)를 설치하지 않고
            SVG 파일과 컴포넌트 하나(<code>WorldMapSvg.vue</code>)만 복사하면 다른 프로젝트에서도 똑같이 동작합니다.
          </p>
        </div>
        <RouterLink :to="{ name: 'WorldMapGallery' }" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-palette me-1"></i>갤러리에서 디자인 고르기
        </RouterLink>
      </div>
    </div>

    <!-- 적용 순서 -->
    <div class="wx-steps mb-3">
      <div v-for="(s, i) in STEPS" :key="i" class="wx-step">
        <span class="wx-step-no">{{ i + 1 }}</span>
        <div>
          <div class="wx-step-title">{{ s.title }}</div>
          <div class="wx-step-desc" v-html="s.desc"></div>
        </div>
      </div>
    </div>

    <!-- 실제 화면 예시 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3 mb-3">
      <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
        <span class="b2b-text-h3 text-theme-primary fw-bold">글로벌 규제 현황</span>
        <span class="wx-kpi"><b>{{ totalRegs }}</b>건 규제</span>
        <span class="wx-kpi"><b>{{ totalCountries }}</b>개국 적용</span>
        <div class="ms-auto d-flex align-items-center gap-2">
          <span class="wx-file"><i class="bi bi-filetype-svg me-1"></i>{{ file.name }} · {{ file.kb }}KB</span>
          <!-- 지도 파일은 사이트 테마(상단 테마 버튼)를 따라 자동으로 바뀐다 -->
          <span class="wx-theme" :class="{ dark: siteDark }" title="사이트 테마를 바꾸면 지도 파일도 바로 바뀌어요">
            <i class="bi" :class="siteDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'"></i>
            사이트 테마 따라감 · {{ siteDark ? '다크' : '라이트' }}
          </span>
        </div>
      </div>

      <WorldMapSvg
        class="wx-map"
        controls
        :light-svg="FILES.light.svg"
        :dark-svg="FILES.dark.svg"
        :regions="regionMenus"
        :countries="clickableCountries"
        @country="goCountry"
        @region="goRegion"
      />

      <p class="b2b-text-sm text-theme-muted mt-2 mb-0">
        <i class="bi bi-hand-index me-1"></i>
        권역 타일을 누르면 주요 국가가 나오고, 국가를 누르면 그 나라 규제 목록으로 이동해요. 지도의 나라 땅을 직접 눌러도 이동해요.
        사이트 테마를 다크/라이트로 바꾸면 지도도 같은 디자인의 다크/라이트 SVG 파일로 바로 바뀌어요 (컴포넌트가 알아서, 파일만 둘).
        지도 왼쪽 위에서 애니메이션과 거점·연결선을 켜고 끌 수 있어요 — 파일을 따로 만들지 않고 화면에서 바로.
      </p>
    </div>

    <!-- 복사해 갈 코드 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3">
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <span class="b2b-text-h3 text-theme-primary fw-bold"><i class="bi bi-code-slash me-1"></i>복사해 갈 코드</span>
        <div class="wx-seg ms-2" role="group" aria-label="코드 파일">
          <button v-for="c in CODES" :key="c.key" type="button" :class="{ on: codeKey === c.key }" @click="codeKey = c.key">
            {{ c.label }}
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary ms-auto" @click="copyCode">
          <i class="bi me-1" :class="copied ? 'bi-check2' : 'bi-clipboard'"></i>{{ copied ? '복사됨' : '복사' }}
        </button>
      </div>
      <div class="wx-code-path">{{ code.path }}</div>
      <pre class="wx-code"><code>{{ code.src }}</code></pre>
    </div>
  </div>
</template>

<script>
import WorldMapSvg from './worldMapExample/WorldMapSvg.vue'
import worldMapComponentSrc from './worldMapExample/WorldMapSvg.vue?raw'
// 갤러리 "파일 저장 → 다크·라이트 한 쌍으로 저장"으로 받은 두 파일을 그대로 넣었다. ?raw = 파일 내용을 문자열로 (Vite)
import lightSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-light-tiles.svg?raw'
import darkSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-dark-tiles.svg?raw'
import { regionCodes, countryCodes } from '@/data/regulationMock'
import { useRegulationStore } from '@/stores/regulationStore'
import { showToast } from '@/utils/toastUtil.js'

// 같은 디자인(미드나잇 도트)의 테마별 파일. 어느 쪽을 보일지는 WorldMapSvg 가 사이트 테마를 보고 정한다
const FILES = {
  light: { name: 'worldmap-midnight-dot-naturalEarth-pacific-light-tiles.svg', svg: lightSvg },
  dark: { name: 'worldmap-midnight-dot-naturalEarth-pacific-dark-tiles.svg', svg: darkSvg }
}
// 아래 파일 이름 칩 표시용 (지도 파일 선택과는 상관없음)
const readSiteDark = () => (document.documentElement.getAttribute('data-theme') || '').startsWith('dark')
Object.values(FILES).forEach((f) => (f.kb = Math.round(f.svg.length / 1024)))

// 지도 SVG 에 들어 있는 권역 타일 (갤러리 권역 타일과 같은 5개)
const TILE_REGIONS = ['R_NA', 'R_LA', 'R_EU', 'R_MEA', 'R_ASIA']
const TOP_N = 6

const STEPS = [
  { title: '디자인 고르기', desc: '세계지도 갤러리에서 디자인을 골라 <b>파일 저장 → 다크·라이트 한 쌍으로 저장 → SVG</b> (권역 타일 켠 채로)' },
  { title: '파일 넣기', desc: '받은 zip 을 풀어 <code>-light</code>·<code>-dark</code> <code>.svg</code> 두 개를 <code>src/assets/worldmap/</code> 에 복사' },
  { title: '컴포넌트 복사', desc: '<code>WorldMapSvg.vue</code> 파일 하나만 프로젝트로 복사 (나라 코드·좌표는 SVG 안에 다 들어 있어요)' },
  { title: '화면에 연결', desc: '<code>?raw</code> 로 SVG 두 개를 불러와 <code>light-svg</code>·<code>dark-svg</code> 로 넘기고, 권역·국가 데이터와 클릭 이동을 연결' }
]

// 화면 쪽 사용 코드: 이 페이지에서 지도에 관련된 부분만 추린 것
const USAGE_SRC = `<template>
  <!-- controls: 지도 왼쪽 위에 애니메이션 / 거점·연결선 ON/OFF 버튼 -->
  <!-- light-svg / dark-svg: 사이트 테마(<html data-theme>)를 따라 컴포넌트가 알아서 바꿔 끼운다 -->
  <WorldMapSvg
    controls
    :light-svg="lightSvg"
    :dark-svg="darkSvg"
    :regions="regionMenus"
    :countries="clickableCountries"
    @country="goCountry"
    @region="goRegion"
  />
</template>

<script>
import WorldMapSvg from '@/components/worldmap/WorldMapSvg.vue'
// 갤러리에서 "다크·라이트 한 쌍"으로 저장한 SVG 두 파일. ?raw 를 붙이면 파일 내용이 문자열로 들어온다 (Vite)
import lightSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-light-tiles.svg?raw'
import darkSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-dark-tiles.svg?raw'

export default {
  components: { WorldMapSvg },
  data: () => ({
    lightSvg,
    darkSvg,
    records: [] /* 규제 목록 API 결과 */
  }),
  computed: {
    // 나라별 규제 건수 { KR: 12, JP: 2, ... }
    countryCounts() {
      const counts = {}
      this.records.forEach((r) => r.countryCds.forEach((cd) => (counts[cd] = (counts[cd] || 0) + 1)))
      return counts
    },
    // 클릭할 수 있는 나라: 규제가 1건 이상인 나라 { KR: '한국', ... }
    clickableCountries() {
      return Object.fromEntries(countryCodes.filter((c) => this.countryCounts[c.code]).map((c) => [c.code, c.name]))
    },
    // 권역 타일 드롭다운 내용. 키는 SVG 의 data-region 값
    regionMenus() {
      const menus = {}
      regionCodes.forEach((r) => {
        const list = countryCodes
          .filter((c) => c.parentCd === r.code && this.countryCounts[c.code])
          .map((c) => ({ code: c.code, name: c.name, count: this.countryCounts[c.code] }))
          .sort((a, b) => b.count - a.count)
        menus[r.code] = {
          name: r.name,
          summary: \`\${list.length}개국\`,
          countries: list.slice(0, 6).map((c) => ({ code: c.code, name: c.name, badge: \`\${c.count}건\` })),
          allCodes: list.map((c) => c.code) // "전체 보기"로 넘길 권역 전체 국가
        }
      })
      return menus
    }
  },
  methods: {
    goCountry(code) {
      this.$router.push({ name: 'RegulationInfo', query: { country: code } })
    },
    goRegion(regionCd, codes) {
      this.$router.push({ name: 'RegulationInfo', query: { country: codes.join(',') } })
    }
  }
}
<\/script>`

const CODES = [
  { key: 'usage', label: '화면 코드 (사용 예)', path: 'src/pages/xxx/MainPage.vue — 지도 부분만', src: USAGE_SRC },
  { key: 'component', label: 'WorldMapSvg.vue', path: 'src/components/worldmap/WorldMapSvg.vue', src: worldMapComponentSrc }
]

export default {
  name: 'WorldMapExamplePage',
  components: { WorldMapSvg },
  data() {
    return {
      STEPS,
      CODES,
      FILES,
      // 사이트 테마가 다크인지 (파일 이름 칩 표시용)
      siteDark: readSiteDark(),
      codeKey: 'usage',
      copied: false,
      store: useRegulationStore()
    }
  },
  computed: {
    file() {
      return this.siteDark ? FILES.dark : FILES.light
    },
    code() {
      return CODES.find((c) => c.key === this.codeKey)
    },
    // 나라별 규제 건수. 규제 하나가 여러 나라에 걸리면 나라마다 1건씩
    countryCounts() {
      const counts = {}
      this.store.records.forEach((r) => {
        new Set((r.targets || []).filter((t) => t.targetType === 'COUNTRY').map((t) => t.targetCd)).forEach(
          (cd) => (counts[cd] = (counts[cd] || 0) + 1)
        )
      })
      return counts
    },
    totalRegs() {
      return this.store.records.length
    },
    totalCountries() {
      return Object.keys(this.countryCounts).length
    },
    clickableCountries() {
      return Object.fromEntries(countryCodes.filter((c) => this.countryCounts[c.code]).map((c) => [c.code, c.name]))
    },
    regionMenus() {
      const menus = {}
      TILE_REGIONS.forEach((cd) => {
        const region = regionCodes.find((r) => r.code === cd)
        const list = countryCodes
          .filter((c) => c.parentCd === cd && this.countryCounts[c.code])
          .map((c) => ({ code: c.code, name: c.name, count: this.countryCounts[c.code] }))
          .sort((a, b) => b.count - a.count)
        menus[cd] = {
          name: region ? region.name : cd,
          summary: `규제 국가 ${list.length}개국`,
          countries: list.slice(0, TOP_N).map((c) => ({ code: c.code, name: c.name, badge: `${c.count}건` })),
          // "전체 보기"는 드롭다운에 보이는 주요 국가만이 아니라 권역의 규제 국가 전체로
          allCodes: list.map((c) => c.code)
        }
      })
      return menus
    }
  },
  created() {
    this.store.ensureLoaded()
    this.themeObserver = new MutationObserver(() => (this.siteDark = readSiteDark()))
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  },
  beforeUnmount() {
    this.themeObserver?.disconnect()
  },
  methods: {
    goCountry(code) {
      this.$router.push({ name: 'RegulationInfo', query: { country: code } })
    },
    goRegion(regionCd, codes) {
      this.$router.push({ name: 'RegulationInfo', query: { country: codes.join(',') } })
    },
    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.code.src)
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch (e) {
        showToast('복사하지 못했어요. 코드를 직접 선택해 복사해 주세요.', { type: 'warning' })
      }
    }
  }
}
</script>

<style scoped>
.wx-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.wx-step {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-card, #fff);
}

.wx-step-no {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--b2b-color-primary, #0d6efd);
}

.wx-step-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--b2b-color-text-main, #212529);
}

.wx-step-desc {
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
  line-height: 1.5;
}

.wx-kpi {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.1);
  color: var(--b2b-color-primary, #0d6efd);
}

.wx-kpi b {
  font-size: 13px;
}

.wx-theme {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #fff4d6;
  color: #8a5a00;
}

.wx-theme.dark {
  background: #1e293b;
  color: #cbd5e1;
}

.wx-file {
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wx-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: var(--b2b-color-tab-bg, #f1f3f5);
}

.wx-seg button {
  border: none;
  background: transparent;
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wx-seg button.on {
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-main, #212529);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

.wx-map {
  border-radius: 14px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
}

/* 모서리 자르기는 지도 그림에만. 바깥까지 자르면 드롭다운이 칸 밖으로 나갈 때 잘린다 */
.wx-map :deep(.wms-svg) {
  border-radius: 13px;
  overflow: hidden;
}

.wx-code-path {
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
  margin-bottom: 6px;
  font-family: var(--bs-font-monospace, monospace);
}

.wx-code {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  padding: 14px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.55;
}
</style>
