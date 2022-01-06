# Importing library
import numpy as np
import cv2
from pyzbar.pyzbar import decode
import sys

def ResizeWithAspectRatio(image, width=None, height=None, inter=cv2.INTER_AREA):
    dim = None
    (h, w) = image.shape[:2]

    if width is None and height is None:
        return image
    if width is None:
        r = height / float(h)
        dim = (int(w * r), height)
    else:
        r = width / float(w)
        dim = (width, int(h * r))

    return cv2.resize(image, dim, interpolation=inter)

img = cv2.imread('images/test.jpg', 0)
detectedBarcodes = decode(img)

# Try to detect the barcode

if not detectedBarcodes:
    print("Barcode Not Detected or your barcode is blank/corrupted!")
    sys.exit()
else:
    
        # Traverse through all the detected barcodes in image
    for barcode in detectedBarcodes: 
        
        # Locate the barcode position in image
        (bx, by, bw, bh) = barcode.rect
            
        if barcode.data!="":
            
        # Print the barcode data
            print('Found barcode: {}'.format(barcode.data))

if len(detectedBarcodes) != 1:
    print('The form seems to contain an invalid number of barcodes.')
    sys.exit()

# Convert 

# Resize the template according to the barcode height
ratio = 20 / 150 * bh / 70 * 1.3
print('Template resize ratio: {:.4f}'.format(ratio))

# Find the template [ ] in the image
template = cv2.imread('template.png', 0)
template = ResizeWithAspectRatio(template, width = int(template.shape[0] * ratio))
tpl_w, tpl_h = template.shape[::-1]
print('New template size: ', tpl_w, tpl_h)

res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
threshold = 0.6
loc = np.where( res >= threshold)

for pt in zip(*loc[::-1]):
    cv2.rectangle(img, pt, (pt[0] + tpl_w, pt[1] + tpl_h), (0,0,255), 2)

# Display the image
cv2.imshow("Image", ResizeWithAspectRatio(img, width=500))
cv2.waitKey(0)
cv2.destroyAllWindows()