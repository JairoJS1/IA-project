// TODO: Replace with your app's Firebase project configuration
const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set, child, get } = require('firebase/database')

var firebaseConfig = {
  apiKey: "AIzaSyC0O2-TVfAoXOhIF_nzO7sHa4-cgN4008Y",
  authDomain: "chat-ia-9d3ea.firebaseapp.com",
  databaseURL: "https://chat-ia-9d3ea-default-rtdb.firebaseio.com",
  projectId: "chat-ia-9d3ea",
  storageBucket: "chat-ia-9d3ea.appspot.com",
  messagingSenderId: "906893768655",
  appId: "1:906893768655:web:c7266c66267434e11ec4ba",
  measurementId: "G-V386MPH98Q"
};
const fireIA = initializeApp(firebaseConfig);

// Get a reference to the database service
const database = getDatabase(fireIA);
function AlmacenarCompra(from, products) {

  set(ref(database, 'Pedidos/' + products.numeroPedido), {
    products
  });
}
let productosRecibidos;
const dbRef = ref(getDatabase(fireIA));
function ObtenerProductos() {
  get(child(dbRef, 'Productos')).then((snapshot) => {
    if (snapshot.exists()) {
      productosRecibidos = snapshot.val();
      console.log(productosRecibidos);
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
    productosRecibidos = null;
  });
}




const { Client, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const exceljs = require('exceljs')
const moment = require('moment')
const express = require('express')
const cors = require('cors');
const e = require('express');
let mensaje = ''
let conversaciones = []
let usuarioSeleccionado = 0
let NumeroFactura = 0;
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
  ObtenerProductos()
  setTimeout(() => {
    Menu()
  }, 3000)

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
  client.on('message', (msg) => {
    const { from, to, body } = msg
    if (conversaciones.length == 0) {
      conversaciones.push({
        number: from,
        message: [body],
        ultimoRecibido: new Date(),
        carrito: []
      })
    } else {
      let exiten = false
      for (let a = 0; a < conversaciones.length; a++) {
        if (conversaciones[a].number == from) {
          if (RangoValido(conversaciones[a].ultimoRecibido, new Date())) {
            conversaciones[a].message.push(body)
            conversaciones[a].ultimoRecibido = new Date()
            console.log('Rango de fechas valido')
          } else {
            conversaciones[a].message = []
            conversaciones[a].ultimoRecibido = new Date()
            conversaciones[a].message.push(body)
            console.log('Rango de fechas Invalido - message reset')
          }

          exiten = true
          break
        }
      }
      if (!exiten) {
        conversaciones.push({
          number: from,
          message: [body],
          ultimoRecibido: new Date(),
          carrito: []
        })
      }
    }
    for (let a = 0; a < conversaciones.length; a++) {
      if (conversaciones[a].number == from) {
        mensaje = conversaciones[a].message
        usuarioSeleccionado = a
        break
      }
    }
    if (mensaje[mensaje.length - 1] == '10') {
      conversaciones[usuarioSeleccionado].message = []
      mensaje = []
    }
    console.log(mensaje)
    switch (mensaje[0].toLowerCase()) {
      default:
        console.log('En default')
        if (mensaje[1] != undefined) {
          console.log('Ejecutando flujo normalizado')
          switch (mensaje[1].toLowerCase()) {
            case '1':
              conversaciones[usuarioSeleccionado].message.pop()
              sendMessage(from, 'Ubicados en algun lugar')
              break
            case '2':
              sendMessage(from, 'En breve uno de nuestros asesores se comunicara contigo 😃')
              sendMessage('50259345499@c.us', `Comunicate con el número: ${from.replace('@c.us', '')}`)
              //
              break
            case '3':
              if (mensaje[2] != undefined) {
                if (mensaje[3] != undefined) {
                  switch (mensaje[3]) {
                    case '1':
                      if (mensaje[4] == undefined) {
                        sendMessage(from, 'Agregado al carrito :\\)')
                        console.log(mensaje[2])

                        let pos = parseInt(mensaje[2]) - 1;
                        let producTemp = productosRecibidos[pos].descripcion
                        let priceTemp = productosRecibidos[pos].precio
                        if(conversaciones[usuarioSeleccionado].carrito[pos]== undefined){
                          conversaciones[usuarioSeleccionado].carrito[pos]=[producTemp, priceTemp,1]
                        }else{
                          let a=conversaciones[usuarioSeleccionado].carrito[pos][2]
                          conversaciones[usuarioSeleccionado].carrito[pos]=[producTemp, priceTemp,a+1]
                        }
                        console.log('Agregado al carrito ' + conversaciones[usuarioSeleccionado].carrito[pos])

                        sendMessage(from, 'Por favor envie el numero de la opcion que deseas 😉 \n 1) Seguir Comprando 2) Finalizar Compra ')
                      }
                      else {
                        switch (mensaje[4]) {
                          case '1':
                            conversaciones[usuarioSeleccionado].message.pop();
                            conversaciones[usuarioSeleccionado].message.pop();
                            conversaciones[usuarioSeleccionado].message.pop();
                            sendMessage(
                              from,
                              Menu(),
                            )
                            break
                          case '2':
                            sendMessage(from, 'Finaliza la compra')
                            
                            let producto = {
                              descripcion: '',
                              precio: '',
                              cantidad: ''
                            }
                            let pedido = {
                              numeroPedido: '',
                              telefonoCliente: '',
                              nombreCliente: '',
                              direccion: '',
                              fechaPedido: '',
                              horaPedido: '',
                              productos: []
                            }
                            let productos = '';
                            let price = 0;
                            console.log(conversaciones[usuarioSeleccionado].carrito)
                            for (let i = 0; i < conversaciones[usuarioSeleccionado].carrito.length; i++) {
                              console.log('Corre for')
                              if(conversaciones[usuarioSeleccionado].carrito[i]!= undefined){
                                producto.descripcion= conversaciones[usuarioSeleccionado].carrito[i][0]
                                producto.precio= conversaciones[usuarioSeleccionado].carrito[i][1]
                                producto.cantidad= conversaciones[usuarioSeleccionado].carrito[i][2]
                                console.log(producto)
                                productos += conversaciones[usuarioSeleccionado].carrito[i][2]+'Uni. Descripción: ' + conversaciones[usuarioSeleccionado].carrito[i][0] + ' Precio Q.' + conversaciones[usuarioSeleccionado].carrito[i][1]*conversaciones[usuarioSeleccionado].carrito[i][2] + '\n';
                                price += conversaciones[usuarioSeleccionado].carrito[i][1];
                               
                                pedido.productos[i]={
                                  descripcion: producto.descripcion,
                                  precio: producto.precio,
                                  cantidad: producto.cantidad
                                }
                                console.log(pedido)
                              } 
                              console.log('FIN FOR') 
                              console.log('Almaceno el producto')
                            }
                            console.log('Salio de Iterar')
                            pedido.numeroPedido=NumeroFactura;
                            pedido.fechaPedido= new Date().toDateString()
                            pedido.horaPedido=new Date().toTimeString()
                            pedido.telefonoCliente=from.replace('@c.us', '')
                            NumeroFactura++
                            try {
                              
                              AlmacenarCompra(from, pedido)
                              console.log('database active')
                            } catch (err) {
                              console.log(err)
                            }
                            sendMessage(from, '\n Recibo No. ' + NumeroFactura + '\n' + productos )
                            break
                          default:
                            sendMessage(from, 'Opcion ingresada no se encuentra')
                            sendMessage(from, 'Por favor envie el numero de la opcion que deseas 😉 \n 1) Seguir Comprando \n2) Finalizar Compra ')
                            conversaciones[usuarioSeleccionado].message.pop()
                        }
                      }
                      break;

                    case '2':
                      conversaciones[usuarioSeleccionado].message.pop()
                      conversaciones[usuarioSeleccionado].message.pop()
                      conversaciones[usuarioSeleccionado].message.pop()
                      sendMessage(from, 'REGRESA :\\)')
                      break;
                    default:
                      conversaciones[usuarioSeleccionado].message.pop()
                      Menu()

                  }
                } else {
                  if (Number.isNaN(parseInt(mensaje[2]))) {
                    sendMessage(from, 'Opcion ingresada no se encuentra')
                    sendMessage(
                      from,
                      Menu(),
                    )
                    conversaciones[usuarioSeleccionado].message.pop()
                  } else if (parseInt(mensaje[2])-1 == productosRecibidos.length) {
                    sendMessage(from, 'Salir')
                    sendMessage(
                      from,
                      Menu(),
                    )
                    conversaciones[usuarioSeleccionado].message.pop()
                  } else if (parseInt(mensaje[2])-1 > productosRecibidos.length) {
                    sendMessage(from, 'Opcion ingresada no se encuentra')
                    sendMessage(
                      from,
                      Menu(),
                    )
                    conversaciones[usuarioSeleccionado].message.pop()
                  } else {
                    let pos = parseInt(mensaje[2]) - 1;
                    let producTemp = productosRecibidos[pos].descripcion
                    let priceTemp = productosRecibidos[pos].precio


                    setTimeout(() => {
                      sendMessage(from, 'Selecciono ' + producTemp)
                      sendMessage(from, 'Precio ' + priceTemp)
                      sendMessage(from, '1. Agregar al carrito\n2. Regresar')
                    }, 1000)
                    sendMedia(from, 'angular.png')
                  }
                }
              } else {
                sendMessage(
                  from,
                  Menu(),
                )
              }
              break
            case '4':
              sendMessage(from, 'Vuelve pronto :\\)')
              conversaciones[usuarioSeleccionado].message = []
              mensaje = []
              break
            default:
              conversaciones[usuarioSeleccionado].message.pop()
              break
          }
        } else {
          console.log('Llamando a menuPrincipal')
          menuPrincipal(from)
        }

        break
      // default:
      //   conversaciones[usuarioSeleccionado].message.pop()
      //   break
    }

    // case 'hola, 1':
    //   sendMessage(from, 'Ubicados en algun lugar')
    //   break;
    // case 'quiero_info':
    //   sendMessage(from, 'Escribeme')
    //   break
    // case 'adios':
    //   sendMessage(from, 'Cuidate')
    //   break
    // case 'hola':
    //   sendMessage(from, 'Bienvenido !!')
    //   sendMedia(from, 'angular.png')
    //   break
    //   default:
    //   sendMessage(from, 'No entiendo')
    //   conversaciones[usuarioSeleccionado].message = '';
    //   break;
    saveHistorial(from, body)
    console.log(from, to, body)
  })
}

function menuPrincipal(destination) {
  sendMessage(destination, 'Hola bienvenido a nuestro Chat Bot🤖 \n A continuacion te mostramos nuestro Menú 😄')
  sendMessage(destination, 'Envianos el numero de la opcion que desees 😊 \n 1. Ubicaciones \n 2. Servicio al cliente \n 3. Realizar un pedido \n 4. Salir')
}
function destroy(data){
return data;
}
function Menu() {
  let mensaje = 'Menú \n'
  for (let i = 0; i < productosRecibidos.length; i++) {
    mensaje += i + 1 + '. ' + productosRecibidos[i].descripcion + '\n'
    console.log(productosRecibidos[i].descripcion)
  }
  mensaje += productosRecibidos.length + 1 + '. Salir'
  return mensaje;
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

function RangoValido(dateLast, dateNew) {
  var difference = Math.abs(dateNew - dateLast);
  mins = difference / (1000 * 60)
  console.log('Verificando Fechas')
  if (mins <= 1) {
    console.log('Fecha Valida')
    return true;
  } else {

    console.log('Fecha Invalida')
    return false;
  }
}
