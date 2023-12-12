import pandas as pd
import numpy as np
from PIL import Image
import cv2
import random
import os
import mido
from mido import Message, MidiFile, MidiTrack
from flask import Flask, render_template, request, send_file

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_midi(image_path):
    img = cv2.imread(image_path)

    # Get the dimensions of the image
    height, width, channels = img.shape

    # Create an empty list to store the pixel data
    pixel_data = []

    # Loop through each pixel and extract its RGB value and x,y coordinates
    for y in range(height):
        for x in range(width):
            # Extract the RGB value of the pixel
            b, g, r = img[y, x]

            # Calculate the grayscale value
            grayscale = 0.299 * r + 0.587 * g + 0.114 * b

            # Add the pixel data to the list
            pixel_data.append({'x': x, 'y': y, 'r': r, 'g': g, 'b': b, 'grayscale': grayscale})

    # Convert the list of pixel data to a pandas DataFrame
    df = pd.DataFrame(pixel_data)

    def integer(row):
        red = max(0, min(255, row[0]))
        green = max(0, min(255, row[1]))
        blue = max(0, min(255, row[2]))

        rgb_integer = (red << 16) + (green << 8) + blue

        return rgb_integer

    rgb = np.array(df[['r', 'g', 'b']])
    df['rgb'] = rgb.tolist()
    df['int'] = df['rgb'].apply(integer)

    df2 = df['int'].unique()
    df2 = pd.DataFrame(df2)

    max_value = df['int'].max()
    df["std_int"] = df["int"] / max_value

    data_values = df['std_int'][::1000]

    # Mapping data values to MIDI note values
    def map_to_midi_pitch(value):
        return int(value * 60) + 60  # Scale the value to MIDI note range 60-120

    # Create a new MIDI file
    mid = MidiFile()

    # Add a new track to the MIDI file
    track = MidiTrack()
    mid.tracks.append(track)

    # Add notes to the track based on the data_values
    for value in data_values:
        pitch = map_to_midi_pitch(value)
        duration = 0.5  # Duration of each note in seconds (e.g., half second)

        # Add a note-on message to start the note
        track.append(Message('note_on', note=pitch, velocity=64, time=0))

        # Add a note-off message to end the note after the specified duration
        track.append(Message('note_off', note=pitch, velocity=64, time=int(duration * 1000)))  # Convert duration to milliseconds

    # Save the MIDI file
    output_file = os.path.join(app.config['UPLOAD_FOLDER'], "output_music.mid")
    mid.save(output_file)
    return output_file

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/convert', methods=['POST'])
def convert_image():
    if 'image' not in request.files:
        return "No image provided.", 400

    image = request.files['image']

    if image.filename == '':
        return "No image selected.", 400

    if image and allowed_file(image.filename):
        # Save the uploaded image
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image.filename)
        image.save(image_path)

        # Call the image_to_midi function to convert the image to .mid file
        midi_file_path = image_to_midi(image_path)

        # Provide the .mid file for download
        return send_file(midi_file_path, as_attachment=True, attachment_filename="output_music.mid")

    return "Invalid file format. Allowed formats: png, jpg, jpeg, gif", 400

if __name__ == "__main__":
    app.run(debug=True)
