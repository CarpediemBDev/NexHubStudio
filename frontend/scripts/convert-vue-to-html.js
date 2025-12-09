import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vue SFC 파일을 순수 HTML 파일로 변환
 * 사용법: node scripts/convert-vue-to-html.js <vue파일경로> [출력파일명]
 * 예시: node scripts/convert-vue-to-html.js src/pages/WorkRequestFormPage.vue work-request.html
 */

// 명령줄 인자 처리
const vueFilePath = process.argv[2];
const outputFileName = process.argv[3];

if (!vueFilePath) {
  console.error('❌ 사용법: node convert-vue-to-html.js <vue파일경로> [출력파일명]');
  console.error('예시: node convert-vue-to-html.js src/pages/WorkRequestFormPage.vue');
  process.exit(1);
}

// Vue 파일 읽기
const vueContent = fs.readFileSync(path.resolve(vueFilePath), 'utf8');

// Template 추출
const templateMatch = vueContent.match(/<template>([\s\S]*?)<\/template>/);
const template = templateMatch ? templateMatch[1].trim() : '';

// Script 추출
const scriptMatch = vueContent.match(/<script>([\s\S]*?)<\/script>/);
const script = scriptMatch ? scriptMatch[1].trim() : '';

// Style 추출
const styleMatch = vueContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
const style = styleMatch ? styleMatch[1].trim() : '';

// Script에서 export default 제거하고 Vue 옵션 추출
let vueOptions = script
  .replace(/^import.*$/gm, '') // import 제거
  .replace(/export default/, '') // export default 제거
  .trim();

// 세미콜론으로 끝나면 제거
if (vueOptions.endsWith(';')) {
  vueOptions = vueOptions.slice(0, -1);
}

// 외부 함수 참조를 안전한 코드로 변경
vueOptions = vueOptions
  .replace(/components:\s*{[^}]*},?\s*/g, '') // components 섹션 제거
  .replace(/await openUserPopup\(\)/g, 'Promise.resolve([])')
  .replace(/openUserPopup\(\)/g, '[]')
  .replace(/this\.\$refs\.progressGrid\?\.add/g, '(() => console.log("progressGrid.add 호출"))()')
  .replace(/this\.\$refs\.progressGrid\?\.deleteSelected/g, '(() => console.log("progressGrid.deleteSelected 호출"))()')
  .replace(/this\.\$router\.push/g, '(() => console.log("router.push 호출, 실제로는:", arguments))');

// 빈 줄 정리
vueOptions = vueOptions.replace(/\n\s*\n\s*\n/g, '\n\n');

// HTML 템플릿 생성
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue to HTML - Converted</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
  
  <style>
${style}
  </style>
</head>
<body>
  <div id="app">
${template}
  </div>

  <!-- Vue 3 CDN -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  
  <script>
    const { createApp } = Vue;

    createApp(${vueOptions}).mount('#app');
  </script>
</body>
</html>
`;

// 출력 파일명 결정
const defaultOutputName = path.basename(vueFilePath, '.vue') + '-converted.html';
const outputPath = path.resolve('frontend', outputFileName || defaultOutputName);

// HTML 파일 저장
fs.writeFileSync(outputPath, html, 'utf8');

console.log('✅ 변환 완료!');
console.log(`📄 입력: ${vueFilePath}`);
console.log(`📄 출력: ${outputPath}`);
console.log('\n🚀 사용법:');
console.log(`   브라우저에서 ${path.basename(outputPath)} 파일을 열면 됩니다.`);
console.log('\n⚠️  주의사항:');
console.log('   - 외부 컴포넌트(import)는 수동으로 처리해야 합니다.');
console.log('   - Vue Router는 CDN에서 별도로 추가해야 합니다.');
console.log('   - 복잡한 빌드 설정은 반영되지 않습니다.');
