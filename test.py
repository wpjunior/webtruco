from gi.repository import WebKit
from gi.repository import Gtk

win = Gtk.Window()
win.connect('destroy', Gtk.main_quit)
port = Gtk.ScrolledWindow()
win.add(port)

table = Gtk.Table()
port.add_with_viewport(table)

for i in xrange(2):
    for j in xrange(2):
        view = WebKit.WebView()
        view.load_uri('http://localhost:3000')
        table.attach(view, i, i+1, j, j+1)

win.show_all()
Gtk.main()
