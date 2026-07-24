/**
 * pivotUtil.js
 * Raw JSON 데이터를 Matrix 형태의 피벗 데이터로 변환하고
 * RealGrid용 동적 컬럼 및 컬럼 헤더 그룹 스펙을 생성합니다.
 */

/**
 * Raw 데이터를 Matrix 데이터로 피벗 가공
 * @param {Array} data - 원본 데이터 배열
 * @param {Object} options - { rowField, colField, valField, aggType: 'sum'|'avg'|'count' }
 * @returns {Object} { rows, fields, columns, colKeys }
 */
export function buildPivotMatrix(data, { rowField, colField, valField, aggType = 'sum' }) {
  if (!Array.isArray(data) || data.length === 0) {
    return { rows: [], fields: [], columns: [], colKeys: [] }
  }

  // 1. 고유한 열(colField) 값 추출 & 정렬
  const rawColValues = [...new Set(data.map(item => String(item[colField] ?? '기타')))]
  rawColValues.sort()

  // 2. 고유한 행(rowField) 단위로 집계 맵 구성
  const matrixMap = new Map()

  data.forEach(item => {
    const rowKey = String(item[rowField] ?? '기타')
    const colKey = String(item[colField] ?? '기타')
    const numVal = Number(item[valField]) || 0

    if (!matrixMap.has(rowKey)) {
      matrixMap.set(rowKey, {
        [rowField]: rowKey,
        _counts: {},
        _sums: {}
      })
    }

    const rowObj = matrixMap.get(rowKey)
    rowObj._sums[colKey] = (rowObj._sums[colKey] || 0) + numVal
    rowObj._counts[colKey] = (rowObj._counts[colKey] || 0) + 1
  })

  // 3. 피벗 행 데이터 생성 (값 계산 및 행 합계)
  const rows = []
  matrixMap.forEach((rowObj, rowKey) => {
    const formattedRow = { [rowField]: rowKey }
    let rowTotalSum = 0
    let rowTotalCount = 0

    rawColValues.forEach(colKey => {
      const sum = rowObj._sums[colKey] || 0
      const count = rowObj._counts[colKey] || 0
      rowTotalSum += sum
      rowTotalCount += count

      if (aggType === 'avg') {
        formattedRow[colKey] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0
      } else if (aggType === 'count') {
        formattedRow[colKey] = count
      } else { // sum
        formattedRow[colKey] = sum
      }
    })

    // 전체 행 합계/평균/건수
    if (aggType === 'avg') {
      formattedRow['_rowTotal'] = rowTotalCount > 0 ? Math.round((rowTotalSum / rowTotalCount) * 10) / 10 : 0
    } else if (aggType === 'count') {
      formattedRow['_rowTotal'] = rowTotalCount
    } else {
      formattedRow['_rowTotal'] = rowTotalSum
    }

    rows.push(formattedRow)
  })

  // 4. RealGrid 필드 및 컬럼 스펙 동적 생성
  const fields = [
    { fieldName: rowField, dataType: 'text' }
  ]

  const columns = [
    {
      name: rowField,
      fieldName: rowField,
      width: '160',
      header: { text: getFieldLabel(rowField) },
      styles: { textAlignment: 'center' }
    }
  ]

  // 피벗 열 컬럼 추가
  rawColValues.forEach(colKey => {
    fields.push({ fieldName: colKey, dataType: 'number' })
    columns.push({
      name: colKey,
      fieldName: colKey,
      width: '130',
      header: { text: colKey },
      numberFormat: '#,##0',
      styles: { textAlignment: 'far' },
      footer: {
        expression: aggType === 'avg' ? 'avg' : (aggType === 'count' ? 'sum' : 'sum'),
        numberFormat: '#,##0',
        styles: { textAlignment: 'far' }
      }
    })
  })

  // 행 합계/총계 컬럼
  fields.push({ fieldName: '_rowTotal', dataType: 'number' })
  columns.push({
    name: '_rowTotal',
    fieldName: '_rowTotal',
    width: '140',
    header: { text: '총계 (' + getAggLabel(aggType) + ')' },
    numberFormat: '#,##0',
    styles: { textAlignment: 'far', fontWeight: 'bold', backgroundColor: '#f8fafc' },
    footer: {
      expression: 'sum',
      numberFormat: '#,##0',
      styles: { textAlignment: 'far', fontWeight: 'bold' }
    }
  })

  return {
    fields,
    columns,
    rows,
    colKeys: rawColValues
  }
}

function getFieldLabel(field) {
  const map = {
    dept: '부서명',
    role: '역할/직급',
    gender: '성별',
    quarter: '분기',
    year: '연도',
    region: '지역'
  }
  return map[field] || field
}

function getAggLabel(type) {
  const map = {
    sum: '합계',
    avg: '평균',
    count: '건수'
  }
  return map[type] || type
}
