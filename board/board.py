#!/usr/bin/env python
"""generate a random board of 0s and 1s"""
import random
from PIL import Image

def filter(x, y):
    'return 1 if over threshold, otherwise 0'
    if (board[x][y] > 80):
        board[x][y] = (0, 0, 0)
    else:
        board[x][y] = (255, 255, 255)
        
size = 10
board = [[random.randint(0, 100) for _ in range(size)] for y in range(size)]
[[filter(x, y) for x in range(size)] for y in range(size)]

image = []
for row in board:
    blank = []
    for tile in row:
        blank += [tile for _ in range(100)]
    for _ in range(100):
        image += blank

img = Image.new('RGB', (1000, 1000))
img.putdata(image)
img.save('board.png')
