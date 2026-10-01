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
            세계지도 갤러리에서 저장한 <b>SVG 파일 하나</b>로 만든 실제 화면입니다. 지도 패키지(d3 등)를 설치하지 않고
            파일과 컴포넌트 하나만 복사하면 다른 프로젝트에서도 똑같이 동작합니다.
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
        :svg="file.svg"
        :regions="regionMenus"
        :countries="clickableCountries"
        @country="goCountry"
        @region="goRegion"
      />

      <p class="b2b-text-sm text-theme-muted mt-2 mb-0">
        <i class="bi bi-hand-index me-1"></i>
        권역 타일을 누르면 주요 국가가 나오고, 국가를 누르면 그 나라 규제 목록으로 이동해요. 지도의 나라 땅을 직접 눌러도 이동해요.
        사이트 테마를 다크/라이트로 바꾸면 지도도 그 테마용 SVG 파일로 바로 바뀌어요 (코드는 그대로, 파일만 둘).
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
import isoNumericSrc from './worldMapExample/isoNumeric.js?raw'
import siteThemeSrc from './worldMapExample/siteTheme.js?raw'
import { isSiteDark, onSiteThemeChange } from './worldMapExample/siteTheme'
// 갤러리 "SVG 파일 저장"으로 받은 파일을 그대로 넣었다. ?raw = 파일 내용을 문자열로 (Vite)
import darkSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-tiles.svg?raw'
import lightSvg from '@/assets/worldmap/worldmap-duotone-naturalEarth-pacific-tiles.svg?raw'
import { regionCodes, countryCodes } from '@/data/regulationMock'
import { useRegulationStore } from '@/stores/regulationStore'
import { showToast } from '@/utils/toastUtil.js'

// 테마별 지도 파일. 사이트가 다크면 dark, 아니면 light
const FILES = {
  dark: { name: 'worldmap-midnight-dot-naturalEarth-pacific-tiles.svg', svg: darkSvg },
  light: { name: 'worldmap-duotone-naturalEarth-pacific-tiles.svg', svg: lightSvg }
}
Object.values(FILES).forEach((f) => (f.kb = Math.round(f.svg.length / 1024)))

// 지도 SVG 에 들어 있는 권역 타일 (갤러리 권역 타일과 같은 5개)
const TILE_REGIONS = ['R_NA', 'R_LA', 'R_EU', 'R_MEA', 'R_ASIA']
const TOP_N = 6

const STEPS = [
  { title: '디자인 고르기', desc: '세계지도 갤러리에서 <b>다크용·라이트용</b> 지도를 하나씩 골라 <b>SVG 파일 저장</b> (권역 타일 켠 채로)' },
  { title: '파일 넣기', desc: '받은 <code>.svg</code> 두 개를 <code>src/assets/worldmap/</code> 에 복사' },
  { title: '컴포넌트 복사', desc: '<code>WorldMapSvg.vue</code>, <code>isoNumeric.js</code>, <code>siteTheme.js</code> 세 파일을 프로젝트로 복사' },
  { title: '화면에 연결', desc: '<code>?raw</code> 로 SVG 두 개를 불러와 사이트 테마에 맞는 쪽을 컴포넌트에 넘기고, 권역·국가 데이터와 클릭 이동을 연결' }
]

// 화면 쪽 사용 코드: 이 페이지에서 지도에 관련된 부분만 추린 것
const USAGE_SRC = `<template>
  <WorldMapSvg
    :svg="siteDark ? darkSvg : lightSvg"
    :regions="regionMenus"
    :countries="clickableCountries"
    @country="goCountry"
    @region="goRegion"
  />
</template>

<script>
import WorldMapSvg from '@/components/worldmap/WorldMapSvg.vue'
import { isSiteDark, onSiteThemeChange } from '@/components/worldmap/siteTheme'
// 갤러리에서 저장한 SVG 파일 (다크용·라이트용). ?raw 를 붙이면 파일 내용이 문자열로 들어온다 (Vite)
import darkSvg from '@/assets/worldmap/worldmap-midnight-dot-naturalEarth-pacific-tiles.svg?raw'
import lightSvg from '@/assets/worldmap/worldmap-duotone-naturalEarth-pacific-tiles.svg?raw'

export default {
  components: { WorldMapSvg },
  data: () => ({
    darkSvg,
    lightSvg,
    siteDark: isSiteDark(), // 사이트 테마가 다크인지
    records: [] /* 규제 목록 API 결과 */
  }),
  created() {
    // 상단 테마 버튼으로 테마를 바꾸면 지도 파일도 바로 바뀐다
    this.stopTheme = onSiteThemeChange((dark) => (this.siteDark = dark))
  },
  beforeUnmount() {
    this.stopTheme()
  },
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
  { key: 'component', label: 'WorldMapSvg.vue', path: 'src/components/worldmap/WorldMapSvg.vue', src: worldMapComponentSrc },
  { key: 'iso', label: 'isoNumeric.js', path: 'src/components/worldmap/isoNumeric.js', src: isoNumericSrc },
  { key: 'theme', label: 'siteTheme.js', path: 'src/components/worldmap/siteTheme.js', src: siteThemeSrc }
]

export default {
  name: 'WorldMapExamplePage',
  components: { WorldMapSvg },
  data() {
    return {
      STEPS,
      CODES,
      // 사이트 테마가 다크인지. 테마가 바뀌면 지도 파일도 따라 바뀐다
      siteDark: isSiteDark(),
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
    this.stopTheme = onSiteThemeChange((dark) => (this.siteDark = dark))
  },
  beforeUnmount() {
    this.stopTheme?.()
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
