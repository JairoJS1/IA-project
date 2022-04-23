const { Client, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const exceljs = require('exceljs')
const moment = require('moment')
const express = require('express')
const cors = require('cors')
// const speech = require('@google-cloud/speech');
// const clientSound = new speech.SpeechClient();

const app = express()

const SESSION_FILE_PATH = '/.session.json'
let sessionData
let client

app.use(express.urlencoded({ extended: true }))
app.use(cors())

const sendWithApi = (req, res) => {
  const { message, to } = req.body
  const nuevoNumero = `${to}@c.us`

  sendMessage(nuevoNumero, message)

  console.log(message, to)
  res.send({ status: ' Enviado' })
}

app.post('/send', sendWithApi)

const withSession = () => {
  console.log(`Cargando Validando la session con Whatsapp...`)
  sessionData = require(SESSION_FILE_PATH)
  client = new Client({
    session: sessionData,
  })

  client.on('ready', () => {
    console.log('Cliente corriendo...')
  })

  client.on('auth_failure', () => {
    console.log('Error en la autenticacion')
  })

  client.initialize()
}

//Esta funcion genera el QRCODE
const withOutSession = () => {
  console.log('No hay session')

  client = new Client()

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr)
    qrcode.generate(qr, { small: true })
  })
  client.on('authenticated', (session) => {
    sessionDatta = session
    if (sessionData) {
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
          console.log(err)
        }
      })
    }
  })

  client.on('ready', () => {
    console.log('Cliente funcionando')
    listenMessage()
  })

  client.initialize()
}

//Esta funcion escucha cuando entra un mesnaje nuevo
const listenMessage = () => {
  client.on('message', msg => {
    const { from, to, body } = msg

    switch (body.toLowerCase()) {
      case 'quiero_info':
        sendMessage(from, 'Escribeme')
        break
      case 'adios':
        sendMessage(from, 'Cuidate')
        break
      case 'hola':
        sendMessage(from, 'Bienvenido !!')
        sendMedia(from, 'angular.png')
        break
    }
    saveHistorial(from, body)
    console.log(from, to, body)
  })
}

const sendMessage = (to, message) => {
  client.sendMessage(to, message)
}

const sendMedia = (to, file) => {
  const mediaFile = MessageMedia.fromFilePath(`./mediaSend/${file}`)

  client.sendMessage(to, mediaFile)
}

const saveHistorial = (number, message) => {
  const pathChat = `./chats/${number}.xlsx`
  const workbook = new exceljs.Workbook()
  const today = moment().format('DD-MM-YYYY hh:mm')

  if (fs.existsSync(pathChat)) {
    workbook.xlsx.readFile(pathChat).then(() => {
      const worksheet = workbook.getWorksheet(1)
      const lastRow = worksheet.lastRow
      let getRowInsert = worksheet.getRow(++lastRow.number)
      getRowInsert.getCell('A').value = today
      getRowInsert.getCell('B').value = message
      getRowInsert.commit()
      workbook.xlsx
        .writeFile(pathChat)
        .then(() => {
          console.log('Se agrego chat')
        })
        .catch((e) => {
          console.log('Error al guardar', e)
        })
    })
  } else {
    const worksheet = workbook.addWorksheet('Chats')
    worksheet.columns = [
      { header: 'Fecha', key: 'date' },
      { header: 'Mensaje', key: 'message' },
    ]

    worksheet.addRow([today, message])
    workbook.xlsx
      .writeFile(pathChat)
      .then(() => {
        console.log('Historial creado!!')
      })
      .catch((e) => {
        console.log('Algo fallo', e)
      })
  }
}

fs.existsSync(SESSION_FILE_PATH) ? withSession() : withOutSession()

app.listen(9000, () => {
  console.log('API ESTA ARRIBA')
})
