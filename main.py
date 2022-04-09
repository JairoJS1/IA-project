import speech_recognition as sr

r = sr.Recognizer()

with sr.Microphone() as source:
    print("Escuchando....")
    audio = r.listen(source)

    try:
        text = r.recognize_google(audio, language='es-GT')
        print("Lo que se dijo: {}".format(text))
    except:
        print("Error al escuchar")