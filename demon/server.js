const express = require('express')
const bwipjs = require('bwip-js')
const app = express()
const port = 3001

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from daemon!' })
})

// 바코드 생성 API
app.get('/api/barcode', (req, res) => {
  const text = req.query.text || '1234567890'
  try {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      },
      function (err, png) {
        if (err) {
          res.status(400).json({ error: '바코드 생성 실패' })
        } else {
          res.set('Content-Type', 'image/png')
          res.send(png)
        }
      }
    )
  } catch (e) {
    res.status(500).json({ error: '서버 오류' })
  }
})

// 가격(텍스트)만 반환하는 API
app.get('/api/price', (req, res) => {
  const { code } = req.query
  // 예시: code에 따라 가격을 다르게 반환
  let price = 0
  if (code === 'EQ-251212345') price = 100000
  else if (code === 'FA-251212345') price = 200000
  else price = 50000
  res.send(price.toString()) // 텍스트로 반환
})

app.listen(port, () => {
  console.log(`Daemon listening at http://localhost:${port}`)
})
