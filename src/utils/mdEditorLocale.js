// md-editor-v3 로케일(언어) 등록
//  - 라이브러리 내장 언어는 en-US / zh-CN 뿐이라, 한국어('ko-KR') 사전을 직접 등록한다.
//  - main.js 에서 1회 import 하면 앱 전역의 MdEditor/MdPreview 에 적용된다.
//  - 공통 컴포넌트 Markdown.vue 가 기본 language="ko-KR" 로 사용한다.
//  - 다른 언어를 추가하려면 아래 languageUserDefined 에 사전을 더한다.
import { config } from 'md-editor-v3'

config({
  editorConfig: {
    languageUserDefined: {
      'ko-KR': {
        toolbarTips: {
          bold: '굵게',
          underline: '밑줄',
          italic: '기울임',
          strikeThrough: '취소선',
          title: '제목',
          sub: '아래첨자',
          sup: '위첨자',
          quote: '인용',
          unorderedList: '순서 없는 목록',
          orderedList: '순서 있는 목록',
          task: '체크리스트',
          codeRow: '인라인 코드',
          code: '코드 블록',
          link: '링크',
          image: '이미지',
          table: '표',
          mermaid: 'Mermaid 다이어그램',
          katex: 'KaTeX 수식',
          revoke: '실행 취소',
          next: '다시 실행',
          save: '저장',
          prettier: '정렬',
          pageFullscreen: '페이지 전체화면',
          fullscreen: '전체화면',
          preview: '미리보기',
          previewOnly: '미리보기만',
          htmlPreview: 'HTML 미리보기',
          catalog: '목차',
          github: '소스 코드',
        },
        titleItem: {
          h1: '제목 1',
          h2: '제목 2',
          h3: '제목 3',
          h4: '제목 4',
          h5: '제목 5',
          h6: '제목 6',
        },
        imgTitleItem: {
          link: '링크 추가',
          upload: '이미지 업로드',
          clip2upload: '잘라서 업로드',
        },
        linkModalTips: {
          linkTitle: '링크 추가',
          imageTitle: '이미지 추가',
          descLabel: '설명:',
          descLabelPlaceHolder: '설명을 입력하세요...',
          urlLabel: '주소:',
          urlLabelPlaceHolder: '링크 주소를 입력하세요...',
          buttonOK: '확인',
        },
        clipModalTips: {
          title: '이미지 잘라서 업로드',
          buttonUpload: '업로드',
        },
        copyCode: {
          text: '코드 복사',
          successTips: '복사되었습니다!',
          failTips: '복사에 실패했습니다!',
        },
        mermaid: {
          flow: '순서도',
          sequence: '시퀀스 다이어그램',
          gantt: '간트 차트',
          class: '클래스 다이어그램',
          state: '상태 다이어그램',
          pie: '파이 차트',
          relationship: '관계 다이어그램',
          journey: '여정 맵',
        },
        katex: {
          inline: '인라인 수식',
          block: '블록 수식',
        },
        footer: {
          markdownTotal: '글자 수',
          scrollAuto: '스크롤 동기화',
        },
      },
    },
  },
})
