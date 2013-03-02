require 'rubygems'
require 'rmagick'

bilder_root = "/Users/andrearonsen/Documents/fagerliearonsen.com/bilder"

img = Magick::Image::read("#{bilder_root}/andreogsarah1.jpg").first

