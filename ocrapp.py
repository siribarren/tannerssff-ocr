import os
from flask import Flask, request, jsonify
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from PIL import Image
import io

app = Flask(__name__)

# Configuración del cliente de Gemini
# Se asume que la API key está configurada en las variables de entorno
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Definición de la estructura JSON requerida mediante Pydantic
class DatosTransaccion(BaseModel):
    tipo_operacion: str = Field(description="Tipo de operación, ej: Transferencia, Vale Vista, Cheque, Pago")
    monto: int = Field(description="Monto numérico de la transacción sin puntos ni signos")
    cuenta_origen: str = Field(description="Número de la cuenta de origen")
    datos_origen: str = Field(description="Detalles adicionales de la cuenta de origen")
    fecha: str = Field(description="Fecha de la transacción")
    hora: str = Field(description="Hora de la transacción")
    cuenta_destino: str = Field(description="Número de la cuenta de destino")

@app.route('/procesar-comprobante', methods=['POST'])
def procesar_comprobante():
    if 'imagen' not in request.files:
        return jsonify({"error": "No se proporcionó ninguna imagen"}), 400
        
    archivo = request.files['imagen']
    
    try:
        # Leer la imagen utilizando Pillow
        imagen = Image.open(io.BytesIO(archivo.read()))
        
        prompt = """
        Analiza la imagen del comprobante bancario adjunto. 
        Extrae los datos solicitados de forma precisa. 
        Si un campo no está presente, déjalo en blanco.
        """
        
        # Llamada a la API de Gemini utilizando el modelo idóneo para multimodalidad (gemini-2.5-flash)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[imagen, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DatosTransaccion,
                temperature=0.1 # Baja temperatura para mayor fidelidad en OCR
            ),
        )
        
        # El response.text ya es una cadena JSON válida que cumple con la estructura de DatosTransaccion
        return response.text, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ejecución en modo desarrollo local
    app.run(port=5000, debug=True)