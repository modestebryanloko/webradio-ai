import io
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pneumonia Detection API")

# 1. Gestion du CORS (Indispensable pour autoriser React à contacter l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En développement, autorise toutes les origines (ex: localhost:5173 / localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Chargement du modèle au démarrage
MODEL_PATH = "densenet121_pneumonia_best.h5"
# Remplacement dans main.py
print("⏳ Chargement du modèle...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("✅ Modèle chargé avec succès !")

# Fonction de pré-traitement de l'image reçue
def prepare_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))
    img_array = np.array(image, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)  # Shape: (1, 224, 224, 3)
    return img_array

# 3. Route d'analyse pour le Frontend
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Lecture du fichier envoyé par React
    contents = await file.read()
    processed_image = prepare_image(contents)
    
    # Prédiction par le modèle
    raw_prediction = model.predict(processed_image)[0][0]
    probability = float(raw_prediction)
    
    # Interprétation du résultat
    is_pneumonia = probability > 0.5
    label = "PNEUMONIA" if is_pneumonia else "NORMAL"
    confidence = probability if is_pneumonia else (1.0 - probability)
    
    return {
        "success": True,
        "filename": file.filename,
        "prediction": label,
        "confidence": round(confidence * 100, 2),  # Pourcentage (ex: 94.5%)
        "probability": round(probability, 4)
    }