var WebTorrent = require('../')
var fs = require('fs')
var http = require('http')
var path = require('path')
var parseTorrent = require('parse-torrent')
var test = require('tape')

var leavesPath = path.resolve(__dirname, 'torrents', 'leaves.torrent')
var leaves = fs.readFileSync(leavesPath)
var leavesTorrent = parseTorrent(leaves)
var leavesBookPath = path.resolve(__dirname, 'content', 'Leaves of Grass by Walt Whitman.epub')
var leavesMagnetURI = 'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=http%3A%2F%2Ftracker.bittorrent.am%2Fannounce&tr=http%3A%2F%2Ftracker.thepiratebay.org%2Fannounce&tr=udp%3A%2F%2Ffr33domtracker.h33t.com%3A3310%2Fannounce&tr=udp%3A%2F%2Ftracker.ccc.de%3A80&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80'
var numbersPath = path.resolve(__dirname, 'content', 'numbers')
var folderPath = path.resolve(__dirname, 'content', 'folder')

test('client.add: http url to a torrent file, string', function (t) {
  t.plan(3)

  var server = http.createServer(function (req, res) {
    t.ok(req.headers['user-agent'].indexOf('WebTorrent') !== -1)
    res.end(leaves)
  })

  server.listen(0, function () {
    var port = server.address().port
    var url = 'http://127.0.0.1:' + port
    var client = new WebTorrent({ dht: false, tracker: false })

    client.on('error', function (err) { t.fail(err) })
    client.on('warning', function (err) { t.fail(err) })

    client.add(url, function (torrent) {
      t.equal(torrent.infoHash, leavesTorrent.infoHash)
      t.equal(torrent.magnetURI, leavesMagnetURI)
      client.destroy()
      server.close()
    })
  })
})

test('client.add: filesystem path to a torrent file, string', function (t) {
  t.plan(2)

  var client = new WebTorrent({ dht: false, tracker: false })

  client.on('error', function (err) { t.fail(err) })
  client.on('warning', function (err) { t.fail(err) })

  client.add(leavesPath, function (torrent) {
    t.equal(torrent.infoHash, leavesTorrent.infoHash)
    t.equal(torrent.magnetURI, leavesMagnetURI)
    client.destroy()
  })
})

test('client.seed: filesystem path to file, string', function (t) {
  t.plan(2)

  var opts = {
    name: 'Leaves of Grass by Walt Whitman.epub',
    announce: [
      'http://tracker.thepiratebay.org/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.ccc.de:80',
      'udp://tracker.publicbt.com:80',
      'udp://fr33domtracker.h33t.com:3310/announce',
      'http://tracker.bittorrent.am/announce'
    ]
  }

  var client = new WebTorrent({ dht: false, tracker: false })

  client.on('error', function (err) { t.fail(err) })
  client.on('warning', function (err) { t.fail(err) })

  client.seed(leavesBookPath, opts, function (torrent) {
    t.equal(torrent.infoHash, leavesTorrent.infoHash)
    t.equal(torrent.magnetURI, leavesMagnetURI)
    client.destroy()
  })
})

test('client.seed: filesystem path to folder with one file, string', function (t) {
  t.plan(2)

  var opts = {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false,     // also force `private: false` to match transmission
    announce: [
      'udp://tracker.webtorrent.io:80'
    ]
  }

  var client = new WebTorrent({ dht: false, tracker: false })

  client.on('error', function (err) { t.fail(err) })
  client.on('warning', function (err) { t.fail(err) })

  client.seed(folderPath, opts, function (torrent) {
    t.equal(torrent.infoHash, '3a686c32404af0a66913dd5f8d2b40673f8d4490')
    t.equal(torrent.magnetURI, 'magnet:?xt=urn:btih:3a686c32404af0a66913dd5f8d2b40673f8d4490&dn=folder&tr=udp%3A%2F%2Ftracker.webtorrent.io%3A80')
    client.destroy()
  })
})

test('client.seed: filesystem path to folder with multiple files, string', function (t) {
  t.plan(2)

  var opts = {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission
  }

  var client = new WebTorrent({ dht: false, tracker: false })

  client.on('error', function (err) { t.fail(err) })
  client.on('warning', function (err) { t.fail(err) })

  client.seed(numbersPath, opts, function (torrent) {
    t.equal(torrent.infoHash, '80562f38656b385ea78959010e51a2cc9db41ea0')
    t.equal(torrent.magnetURI, 'magnet:?xt=urn:btih:80562f38656b385ea78959010e51a2cc9db41ea0&dn=numbers&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.webtorrent.io')
    client.destroy()
  })
})
