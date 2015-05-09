
// Creates letter avatars for users without pictures.

var Canvas = require('canvas')
var fs = require('fs')
var path = require('path')

var DIMENSION = 100

//

var FOLDER_PATH = path.join(__dirname, 'avatars')

function makeFolder() {
    try {
        var stat = fs.lstatSync(FOLDER_PATH)
    } catch (e) {
        fs.mkdir(FOLDER_PATH)
    }
}

var colors = ["rgb(103,65,114)", "rgb(68,108,179)", "rgb(210,77,87)", "rgb(65,131,215)", "rgb(89,171,227)", "rgb(129,207,224)", "rgb(82,179,217)", "rgb(34,167,240)", "rgb(52,152,219)", "rgb(44,62,80)", "rgb(25,181,254)", "rgb(51,110,123)", "rgb(34,49,63)", "rgb(30,139,195)", "rgb(58,83,155)", "rgb(52,73,94)", "rgb(103,128,159)", "rgb(37,116,169)", "rgb(31,58,147)", "rgb(137,196,244)", "rgb(75,119,190)", "rgb(92,151,191)", "rgb(78,205,196)", "rgb(135,211,124)", "rgb(144,198,149)", "rgb(38,166,91)", "rgb(3,201,169)", "rgb(104,195,163)", "rgb(101,198,187)", "rgb(27,188,155)", "rgb(27,163,156)", "rgb(102,204,153)", "rgb(54,215,183)", "rgb(134,226,213)", "rgb(46,204,113)", "rgb(22,160,133)", "rgb(63,195,128)", "rgb(1,152,117)", "rgb(3,166,120)", "rgb(77,175,124)", "rgb(42,187,155)", "rgb(0,177,106)", "rgb(30,130,76)", "rgb(4,147,114)", "rgb(38,194,129)", "rgb(248,148,6)", "rgb(235,149,50)", "rgb(232,126,4)", "rgb(244,178,80)", "rgb(242,120,75)", "rgb(235,151,78)", "rgb(254,171,53)", "rgb(211,84,0)", "rgb(243,156,18)", "rgb(249,105,14)", "rgb(249,191,59)", "rgb(242,121,53)", "rgb(230,126,34)", "rgb(108,122,137)", "rgb(189,195,199)", "rgb(149,165,166)", "rgb(171,183,183)", "rgb(191,191,191)"];

makeFolder()

var canvas = new Canvas(DIMENSION,DIMENSION)
var ctx = canvas.getContext('2d')

function doLetter(letter, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(DIMENSION/2, DIMENSION/2, DIMENSION/2, 0, Math.PI*2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.font = '500 80px museosans'
    var te = ctx.measureText(letter)
    
    console.log(letter, te, color)
    var y = (te.actualBoundingBoxAscent+DIMENSION)/2;
    ctx.fillText(letter, (DIMENSION-te.width)/2, y)
    fs.writeFileSync(FOLDER_PATH+'/'+letter+'.png', canvas.toBuffer())
}

var letters = "abcdefghijklmnopqrstuvwxyz";
for (var i=0; i<letters.length; ++i) {
    var color = colors[Math.floor(Math.random()*colors.length)]
    colors.splice(colors.indexOf(color), 1)
    doLetter(letters[i].toUpperCase(), color);
}
